import { WebSocketServer, WebSocket } from "ws";

interface ExtendedWebSocket extends WebSocket {
   isAlive?: boolean;
}

const wss = new WebSocketServer({ port: 3134 });

wss.on("connection", (ws: ExtendedWebSocket) => {
   const ip = (ws as any)._socket.remoteAddress?.replace("::ffff:", "");

   console.log(`[sensor-ws] client ${ip} connected`);

   ws.send(JSON.stringify({ type: "ready", message: "WebSocket connected" }));

   ws.on("message", (raw) => {
      try {
         const payload = JSON.parse(raw.toString());
         console.log("[sensor-ws] payload", payload);

         // Broadcast the new reading to any connected listeners
         wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
               client.send(JSON.stringify({ type: "sensor-data", payload }));
            }
         });
      } catch (error) {
         ws.send(JSON.stringify({ type: "error", message: "Invalid JSON payload" }));
         console.error("[sensor-ws] invalid payload", error);
      }
   });

   ws.on("pong", () => {
      ws.isAlive = true;
   });

   ws.on("close", () => {
      const ip = (ws as any)._socket.remoteAddress?.replace("::ffff:", "");
      console.log(`[sensor-ws] client ${ip} disconnected`);
   });
});

setInterval(() => {
   wss.clients.forEach((ws: any) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
   });
}, 30000);

console.log("[sensor-ws] server started on port 3134");

wss.on("error", (error: any) => {
   console.error("[sensor-ws] server error", error);
});

export interface SensorPayload {
   temperature?: number;
   humidity?: number;
   pressure?: number;
   airQuality?: number;
}
