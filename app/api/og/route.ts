import { NextResponse, NextRequest } from "next/server";
import Canvas from "canvas";
import { exec } from "child_process";

type Ctx = Canvas.CanvasRenderingContext2D;
import { StatsData, DiskData } from "@/app/types";

// MARK: - getStats
async function getStats(): Promise<StatsData> {
   return new Promise((resolve, reject) => {
      exec("top -b -n1 | head -n 5 && mpstat -P ALL 1 1 && sensors && hostname", (err, stdout) => {
         if (err) {
            reject(err);
            return;
         }
         const sections = stdout.split(/\n\n+/);
         const topLines = sections[0].split("\n");
         const hostname = stdout.trim().split("\n").pop() || "unknown";

         const loadAvg = topLines[0].match(/load average: ([\d.]+), ([\d.]+), ([\d.]+)/);
         const cpu = topLines[2].match(/(\d+\.\d+) us,\s+(\d+\.\d+) sy,.*?(\d+\.\d+) id/);
         const mem = topLines[3].match(
            /(\d+\.\d+) total,\s+(\d+\.\d+) free,\s+(\d+\.\d+) used,\s+(\d+\.\d+) buff\/cache/
         );
         const swap = topLines[4].match(
            /(\d+\.\d+) total,\s+(\d+\.\d+) free,\s+(\d+\.\d+) used.*?(\d+\.\d+) avail Mem/
         );

         resolve({
            loadAverage: {
               "1min": loadAvg?.[1] || "0",
               "5min": loadAvg?.[2] || "0",
               "15min": loadAvg?.[3] || "0"
            },
            cpu: {
               user: cpu?.[1] || "0",
               system: cpu?.[2] || "0",
               idle: cpu?.[3] || "100",
               perCore: {} as any
            },
            memory: {
               total: mem?.[1] || "0",
               free: mem?.[2] || "0",
               used: mem?.[3] || "0",
               cache: mem?.[4] || "0"
            },
            swap: {
               total: swap?.[1] || "0",
               free: swap?.[2] || "0",
               used: swap?.[3] || "0",
               availableMem: swap?.[4] || "0"
            },
            sensors: [],
            hostname,
            generatedAt: new Date().toISOString()
         });
      });
   });
}

// MARK: - getDiskInfo
async function getDiskInfo(): Promise<DiskData> {
   return new Promise((resolve, reject) => {
      exec("df -h", (err, stdout) => {
         if (err) {
            resolve({ size: "N/A", used: "N/A", avail: "N/A", usePercent: "0%", health: "UNKNOWN" });
            return;
         }
         const lines = stdout.trim().split("\n");
         const index = lines.findIndex((line) => line.includes("/dev/mapper/"));
         const data = lines[index].split(/\s+/);
         resolve({
            size: data[1],
            used: data[2],
            avail: data[3],
            usePercent: data[4],
            health: "OK"
         });
      });
   });
}

// MARK: - drawPieChart
function drawPieChart(
   ctx: Ctx,
   centerX: number,
   centerY: number,
   radius: number,
   innerRadius: number,
   data: { value: number; color: string; label: string }[],
   title: string,
   centerText: string
) {
   const total = data.reduce((sum, item) => sum + item.value, 0);
   let startAngle = -Math.PI / 2;

   //draw donut segments
   data.forEach((segment) => {
      const sliceAngle = (segment.value / total) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();

      startAngle = endAngle;
   });

   // center percentage
   ctx.fillStyle = "#ffffff";
   ctx.font = "bold 28px Arial";
   ctx.textAlign = "center";
   ctx.textBaseline = "middle";
   ctx.fillText(centerText, centerX, centerY - 5);
   
   // center title
   ctx.font = "14px Arial";
   ctx.fillStyle = "#a0a0a0";
   ctx.fillText(title, centerX, centerY + 20);
}

// MARK: - drawStatBox
function drawStatBox(
   ctx: Ctx,
   x: number,
   y: number,
   width: number,
   height: number,
   title: string,
   value: string,
   subtitle?: string
) {
   // box bg
   ctx.fillStyle = "#1e1e2e";
   ctx.beginPath();
   ctx.roundRect(x, y, width, height, 8);
   ctx.fill();

   // Border
   ctx.strokeStyle = "#3e3e5e";
   ctx.lineWidth = 1;
   ctx.stroke();

   // Title
   ctx.fillStyle = "#a0a0a0";
   ctx.font = "12px Arial";
   ctx.textAlign = "center";
   ctx.fillText(title, x + width / 2, y + 20);

   // Value
   ctx.fillStyle = "#ffffff";
   ctx.font = "bold 18px Arial";
   ctx.fillText(value, x + width / 2, y + 45);

   // Subtitle
   if (subtitle) {
      ctx.fillStyle = "#707070";
      ctx.font = "11px Arial";
      ctx.fillText(subtitle, x + width / 2, y + 65);
   }
}

// MARK: - drawProgressBar
function drawProgressBar(
   ctx: Ctx,
   x: number,
   y: number,
   width: number,
   height: number,
   percentage: number,
   color: string,
   bgColor: string
) {
   // Background
   ctx.fillStyle = bgColor;
   ctx.beginPath();
   ctx.roundRect(x, y, width, height, 4);
   ctx.fill();

   // Progress
   const progressWidth = (percentage / 100) * width;
   ctx.fillStyle = color;
   ctx.beginPath();
   ctx.roundRect(x, y, progressWidth, height, 4);
   ctx.fill();
}

// MARK: - Route Handler
export async function GET(request: NextRequest) {
   const width = 1200;
   const height = 630;

   try {
      const [stats, disk] = await Promise.all([getStats(), getDiskInfo()]);

      const canvas = Canvas.createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // bg gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0a0a1a");
      gradient.addColorStop(1, "#1e1e2e");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 36px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`${stats.hostname}`, 40, 60);

      ctx.font = "16px Arial";
      ctx.fillStyle = "#a0a0a0";
      const date = new Date(stats.generatedAt || Date.now());
      ctx.fillText(`Updated: ${date.toLocaleString("it-IT")}`, 40, 90);


      // MARK: - CPU Section
      const cpuUser = parseFloat(stats.cpu.user);
      const cpuSystem = parseFloat(stats.cpu.system);
      const cpuIdle = parseFloat(stats.cpu.idle);
      const cpuUsage = (100 - cpuIdle).toFixed(1);

      drawPieChart(
         ctx,
         150,
         280,
         90,
         55,
         [
            { value: cpuUser, color: "#e74c3c", label: "User" },
            { value: cpuSystem, color: "#3498db", label: "System" },
            { value: cpuIdle, color: "#2c3e50", label: "Idle" }
         ],
         "CPU",
         `${cpuUsage}%`
      );

      // CPU Legend
      ctx.font = "12px Arial";
      ctx.textAlign = "left";

      ctx.fillStyle = "#e74c3c";
      ctx.fillRect(70, 400, 12, 12);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`User: ${cpuUser.toFixed(1)}%`, 88, 407);

      ctx.fillStyle = "#3498db";
      ctx.fillRect(70, 420, 12, 12);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`System: ${cpuSystem.toFixed(1)}%`, 88, 427);

      ctx.fillStyle = "#2c3e50";
      ctx.fillRect(170, 400, 12, 12);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`Idle: ${cpuIdle.toFixed(1)}%`, 188, 407);

      // MARK: - Memory Section
      const memTotal = parseFloat(stats.memory.total);
      const memUsed = parseFloat(stats.memory.used);
      const memCache = parseFloat(stats.memory.cache);
      const memFree = parseFloat(stats.memory.free);
      const memUsedPercent = ((memUsed / memTotal) * 100).toFixed(1);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "left";
      ctx.fillText("Memory", 320, 180);

      ctx.font = "14px Arial";
      ctx.fillStyle = "#a0a0a0";
      ctx.fillText(`Total: ${(memTotal / 1024).toFixed(1)} GB`, 320, 210);

      // Memory bar
      drawProgressBar(ctx, 320, 230, 300, 24, parseFloat(memUsedPercent), "#9b59b6", "#2c3e50");

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px Arial";
      ctx.fillText(`${memUsedPercent}% used`, 320, 275);

      ctx.font = "12px Arial";
      ctx.fillStyle = "#a0a0a0";
      ctx.fillText(
         `Used: ${(memUsed / 1024).toFixed(1)} GB | Cache: ${(memCache / 1024).toFixed(1)} GB | Free: ${(
            memFree / 1024
         ).toFixed(1)} GB`,
         320,
         295
      );

      // MARK: - Swap Section 
      const swapTotal = parseFloat(stats.swap.total);
      const swapUsed = parseFloat(stats.swap.used);
      const swapPercent = swapTotal > 0 ? ((swapUsed / swapTotal) * 100).toFixed(1) : "0";

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px Arial";
      ctx.fillText("Swap", 320, 340);

      ctx.font = "14px Arial";
      ctx.fillStyle = "#a0a0a0";
      ctx.fillText(`Totale: ${(swapTotal / 1024).toFixed(1)} GB`, 320, 370);

      drawProgressBar(ctx, 320, 390, 300, 20, parseFloat(swapPercent), "#f39c12", "#2c3e50");

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px Arial";
      ctx.fillText(`${swapPercent}% used`, 320, 430);

      // MARK: - Disk Section
      const diskPercent = parseInt(disk.usePercent) || 0;

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px Arial";
      ctx.fillText("Disco", 320, 480);

      ctx.font = "14px Arial";
      ctx.fillStyle = "#a0a0a0";
      ctx.fillText(`Total: ${disk.size} | Used: ${disk.used} | Free: ${disk.avail}`, 320, 510);

      drawProgressBar(ctx, 320, 530, 300, 20, diskPercent, "#1abc9c", "#2c3e50");

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px Arial";
      ctx.fillText(`${disk.usePercent} used`, 320, 570);

      // Load Average boxes
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "left";
      ctx.fillText("Load Average", 700, 180);

      drawStatBox(ctx, 700, 200, 100, 80, "1 min", stats.loadAverage["1min"]);
      drawStatBox(ctx, 810, 200, 100, 80, "5 min", stats.loadAverage["5min"]);
      drawStatBox(ctx, 920, 200, 100, 80, "15 min", stats.loadAverage["15min"]);

      // System Info boxes
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px Arial";
      ctx.fillText("System", 740, 320);

      drawStatBox(ctx, 700, 340, 150, 80, "Hostname", stats.hostname);
      drawStatBox(ctx, 870, 340, 150, 80, "Disk", disk.health || "Unknown", "Health Status");

      // CPU/Memory summary boxes
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px Arial";
      ctx.fillText("Summary", 750, 460);

      drawStatBox(ctx, 700, 480, 150, 90, "CPU", `${cpuUsage}%`, "Total Usage");
      drawStatBox(ctx, 870, 480, 150, 90, "RAM", `${memUsedPercent}%`, "Memory Used");

      // Footer
      ctx.fillStyle = "#505050";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Kiosk System Monitor", width / 2, height - 20);

      // Return as PNG image
      const buffer = canvas.toBuffer("image/png");

      return new NextResponse(new Uint8Array(buffer), {
         headers: {
            "Content-Type": "image/png",
            "Cache-Control": "no-store, max-age=0"
         }
      });
   } catch (error) {
      console.error("Error generating OG image:", error);
      return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
   }
}
