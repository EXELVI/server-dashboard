import { NextResponse } from "next/server";
import { exec } from "child_process";

export async function GET() {
   return new Promise((resolve, reject) => {
      exec("top -b -n1 | head -n 5 && mpstat -P ALL 1 1 && sensors && hostname", (err, stdout) => {
         if (err) {
            reject(NextResponse.json({ error: err.message }, { status: 500 }));
            return;
         }

         const sections = stdout.split(/\n\n+/);

         const topLines = sections[0].split("\n");
         const mpstatLines = sections[1]?.split("\n") || [];
         const sensorsLines = sections.slice(3).join("\n").split("\n");
         const hostname = stdout.trim().split("\n").pop() || "unknown";

         const loadAvg = topLines[0].match(/load average: ([\d.]+), ([\d.]+), ([\d.]+)/);
         const cpu = topLines[2].match(/(\d+\.\d+) us,\s+(\d+\.\d+) sy,.*?(\d+\.\d+) id/);
         const mem = topLines[3].match(
            /(\d+\.\d+) total,\s+(\d+\.\d+) free,\s+(\d+\.\d+) used,\s+(\d+\.\d+) buff\/cache/
         );
         const swap = topLines[4].match(
            /(\d+\.\d+) total,\s+(\d+\.\d+) free,\s+(\d+\.\d+) used.*?(\d+\.\d+) avail Mem/
         );
 

         const perCore = mpstatLines
            .filter((line) => line.includes("all") || line.match(/^\s*\d+/))
            .map((line) => {
               const parts = line.trim().split(/\s+/); 
               return {
                  core: parts[2] || parts[1],
                  user: parts.at(-7),
                  system: parts.at(-5),
                  idle: parts.at(-1)
               };
            });

         const temps: { chip: string; label: string; value: string }[] = [];
         let currentSensor = "";

         sensorsLines.forEach((line) => {
            if (!line.includes(":")) {
               currentSensor = line.trim();
            } else {
               const [label, value] = line.split(":"); 
               temps.push({
                  chip: currentSensor,
                  label: label.trim(),
                  value: value.trim()
                  //value: '        +190.0°C  (high = +150.0°C, crit = +200.0°C)'
               });
            }
         });

         resolve(
            NextResponse.json({
               loadAverage: {
                  "1min": loadAvg?.[1],
                  "5min": loadAvg?.[2],
                  "15min": loadAvg?.[3]
               },
               cpu: {
                  user: cpu?.[1],
                  system: cpu?.[2],
                  idle: cpu?.[3],
                  perCore: perCore.filter((c) => c.core !== "CPU")
               },
               memory: {
                  total: mem?.[1],
                  free: mem?.[2],
                  used: mem?.[3],
                  cache: mem?.[4]
               },
               swap: {
                  total: swap?.[1],
                  free: swap?.[2],
                  used: swap?.[3],
                  availableMem: swap?.[4]
               },
               sensors: temps,
               hostname,
               generatedAt: new Date().toISOString()
            })
         );
      });
   });
}
