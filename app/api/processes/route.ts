import { NextResponse } from "next/server";
import { exec } from "child_process";
import { count } from "console";

type ProcessInfo = {
   pid: number;
   ppid: number;
   cpu: number;
   mem: number;
   elapsedSeconds: number;
   command: string;
};

export async function GET() {
   return new Promise<NextResponse>((resolve) => {
      exec("ps -eo pid,ppid,pcpu,pmem,etimes,comm --no-headers", (error, stdout, stderr) => {
         if (error) {
            resolve(NextResponse.json({ error: "Failed to retrieve process information" }, { status: 500 }));
            return;
         }

         const processes: ProcessInfo[] = stdout
            .trim()
            .split("\n")
            .map((line) => {
               const match = line.trim().match(/^(\d+)\s+(\d+)\s+([\d.]+)\s+([\d.]+)\s+(\d+)\s+(.+)$/);
               if (!match) return null;
               const [, pid, ppid, cpu, mem, elapsedSeconds, command] = match;
               return {
                  pid: Number(pid),
                  ppid: Number(ppid),
                  cpu: parseFloat(cpu),
                  mem: parseFloat(mem),
                  elapsedSeconds: Number(elapsedSeconds),
                  command: command.trim()
               };
            })
            .filter((item): item is ProcessInfo => Boolean(item));

         resolve(NextResponse.json({ processes, count: processes.length, generatedAt: new Date().toISOString() }));
      });
   });
}
