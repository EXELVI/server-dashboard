const debug = false;
const PORT = 3134;

import { WebSocketServer, WebSocket } from "ws";
import Chalk from "chalk";

interface ExtendedWebSocket extends WebSocket {
   isAlive?: boolean;
}

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws: ExtendedWebSocket) => {
   ws.isAlive = true;

   const ip = (ws as any)._socket.remoteAddress?.replace("::ffff:", "");

   console.log(Chalk.green(`[sensor-ws] client ${ip} connected`)) ;

   ws.send(JSON.stringify({ type: "ready", message: "WebSocket connected" }));

   ws.on("message", (raw) => {
      try {
         const payload = JSON.parse(raw.toString());
         if (debug) console.log(Chalk.cyan("[sensor-ws] payload"), payload);

         if (typeof payload?.command === "string") {
            const commandPayload = JSON.stringify({ command: payload.command });
            wss.clients.forEach((client) => {
               if (client.readyState === WebSocket.OPEN) {
                  client.send(commandPayload);
               }
            });
            return;
         }

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
      console.log(Chalk.red(`[sensor-ws] client ${ip} disconnected`));
   });
});

// Heartbeat to detect and close dead connections
setInterval(() => {
   wss.clients.forEach((ws: any) => {
      if (!ws.isAlive) {
         console.log(Chalk.yellow("[sensor-ws] terminating unresponsive client"));
         return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
   });
}, 30000);

console.log(Chalk.blue(`[sensor-ws] server started on port ${PORT}`));

wss.on("error", (error: any) => {
   console.error("[sensor-ws] server error", error);
});

export interface SensorPayload {
   temperature?: number;
   humidity?: number;
   pressure?: number;
   airQuality?: number;
   displayEnabled?: boolean;
}
