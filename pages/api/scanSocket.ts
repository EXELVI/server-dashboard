import { NextApiRequest, NextApiResponse } from "next";
const Server = require("socket.io" as any).Server || require("socket.io");
const festaa = require("fs");

import { exec } from "child_process";
import { Coming_Soon } from "next/font/google";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
   // @ts-ignore
   if (!res.socket.server.io) {
      console.log("Initializing Socket.io server...");
      const io = new Server((res.socket as any).server as any, {
         cors: {
            origin: true,
            methods: ["GET", "POST"]
         }
      });

      io.on("connection", (socket: any) => {
         console.log("Socket connected:", socket.id);

         socket.on("message", (data: string) => {
            if (data === "startScan") {
               socket.emit("message", "Scan started");

               let filePath = `${process.env.scansDir || "/scans"}/scan_${1000}.png`;
               let fileName = `scan_${1000}.png`;

               do {
                  const randomNum = Math.floor(Math.random() * 9000) + 1000;
                  filePath = `${process.env.scansDir || "/scans"}/scan_${randomNum}.png`;
                  fileName = `scan_${randomNum}.png`;
               } while (festaa.existsSync(filePath));

               exec(`scanimage --format=png --mode Color --output-file=${filePath}`, (error, stdout, stderr) => {
                  if (error) {
                     console.error(`Error during scan: ${error.message}`);
                     const message = {
                        status: "error",
                        error: error.message
                     };
                     socket.emit("scanStatus", JSON.stringify(message));
                     return;
                  }

                  console.log(`Scan completed: ${fileName}`, stdout, stderr);
                  const message = {
                     status: "completed",
                     routePath: `/scans/${fileName}`,
                     fileName: fileName
                  };
                  socket.emit("scanStatus", JSON.stringify(message));
               });
            } else if (data === "mockScan") {
               socket.emit("message", "Mock scan started");

               setTimeout(() => {
                  const message = {
                     status: "completed",
                     routePath: `/scans/mock.png`,
                     fileName: `mock.png`
                  };
                  socket.emit("scanStatus", JSON.stringify(message));
               }, 3000);
            }
         });

         socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
         });
      });

      // @ts-ignore
      res.socket.server.io = io;
   }
   res.status(200).end();
}
