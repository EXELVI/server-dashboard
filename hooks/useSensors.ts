import { useCallback, useEffect, useRef, useState } from "react";
import { SensorData } from "@/app/types";

export type SensorPayload = {
   temperature?: number;
   humidity?: number;
   pressure?: number;
   airQuality?: number;
   displayEnabled?: boolean;
   deviceId?: string;
   timestamp?: string;
};

type UseSensorsParams = {
   setData: React.Dispatch<React.SetStateAction<SensorData | undefined>>;
   onDisconnect?: () => void;
   onConnect?: () => void;
   enabled?: boolean; 
};

type UseSensorsResult = {
   sendCommand: (command: string) => boolean;
   isConnected: boolean;
};

export function useSensors({ setData, onDisconnect, onConnect, enabled = true,}: UseSensorsParams): UseSensorsResult {
   const wsRef = useRef<WebSocket | null>(null);
   const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const [isConnected, setIsConnected] = useState(false);

   const clearRetryTimeout = useCallback(() => {
      if (retryTimeoutRef.current) {
         clearTimeout(retryTimeoutRef.current);
         retryTimeoutRef.current = null;
      }
   }, []);

   useEffect(() => {
      if (!enabled) {
         setIsConnected(false);
         return;
      }

      let stopped = false;

      const connect = () => {
         if (stopped) return;

         const ws = new WebSocket(`ws://${window.location.hostname}:3134`);
         wsRef.current = ws;

         ws.onopen = () => {
            console.log("%c [dashboard-ws] connected", "color: green");
            setIsConnected(true);
            onConnect?.();
         };

         ws.onmessage = (event) => {
            try {
               const msg = JSON.parse(event.data);

               console.log("%c [dashboard-ws] message", "color: blue", msg);

               if (msg.type === "sensor-data" && msg.payload) {
                  const payload: SensorPayload = msg.payload;

                  const sensorData: SensorData = {
                     success: true,
                     data: {
                        temperature: payload.temperature || 0,
                        humidity: payload.humidity || 0,
                        pressure: payload.pressure || 0,
                        airQuality: payload.airQuality || 0,
                     },
                     displayEnabled: typeof payload.displayEnabled === "boolean" ? payload.displayEnabled : undefined,
                     device: payload.deviceId ? `${payload.deviceId} (WS)` : "Unknown Device (WS)",
                     isOnline: true,
                     lastUpdate: payload.timestamp || new Date().toISOString(),
                  };

                  setData(sensorData);
               }
            
            } catch (error) {
               console.error("%c [dashboard-ws] invalid message", error);
            }
         };

         ws.onclose = () => {
            if (stopped) return;
            console.log("%c [dashboard-ws] disconnected", "color: red");
            console.log("%c [dashboard-ws] attempting to reconnect in 5 seconds...", "color: orange");
            setIsConnected(false);
            onDisconnect?.();
            clearRetryTimeout();
            retryTimeoutRef.current = setTimeout(connect, 5000);
         };

         ws.onerror = (error) => {
            if (stopped) return;
            console.error("[dashboard-ws] error", error);
            setIsConnected(false);
            ws.close();
         };
      };

      connect();

      return () => {
         stopped = true;
         clearRetryTimeout();
         if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
         }
         setIsConnected(false);
      };
   }, [clearRetryTimeout, enabled, onConnect, onDisconnect, setData]);

   const sendCommand = useCallback(
      (command: string) => {
         if (!enabled) return false;

         const ws = wsRef.current;
         if (!ws || ws.readyState !== WebSocket.OPEN) {
            return false;
         }

         ws.send(JSON.stringify({ command }));
         return true;
      },
      [enabled]
   );

   return { sendCommand, isConnected };
}
