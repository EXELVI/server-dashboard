import { Stats } from "fs";
import { DiskData, SensorData, StatsData, LogType } from "../types";

// MARK: - Helpers

const clamp = (v: number, min: number, max: number): number => Math.min(Math.max(v, min), max);

const randFloat = (min: number, max: number): number => Math.random() * (max - min) + min;

const randInt = (min: number, max: number): number => Math.floor(randFloat(min, max + 1));

const roundTo = (value: number, decimals = 1): number => {
   const p = 10 ** decimals;
   return Math.round(value * p) / p;
};

const toFixedStr = (n: number, decimals = 1): string => roundTo(n, decimals).toFixed(decimals);

const randomItem = <T>(items: readonly T[]): T => items[randInt(0, items.length - 1)];

// MARK: - Formatting

const formatTemp = (temp: number, high: number, crit: number): string =>
   `+${toFixedStr(temp, 1)}°C (high = ${toFixedStr(high, 1)}°C, crit = ${toFixedStr(crit, 1)}°C)`;

// MARK: - Disk

const DISK_TOTALS = {
   system: 480,
   storage: 4000
} as const;

const DISK_SUFFIX = {
   system: "G",
   storage: "T"
} as const;

const buildDisk = (label: "system" | "storage"): DiskData => {
   const total = DISK_TOTALS[label];
   const percent = roundTo(randFloat(25, 92), 1);
   const used = (total * percent) / 100;
   const minAvail = total * 0.05;
   const avail = Math.max(total - used, minAvail);
   const suffix = DISK_SUFFIX[label];

   return {
      usePercent: `${toFixedStr(percent, 1)}%`,
      used: `${toFixedStr(used, 1)}${suffix}`,
      avail: `${toFixedStr(avail, 1)}${suffix}`,
      size: `${toFixedStr(total, 1)}${suffix}`,
      filesystem: label === "storage" ? "/dev/sda1" : "/dev/nvme0n1p2",
      mountPoint: label === "storage" ? "/mnt/storage" : "/",
      ioStatus: Math.random() < 0.1 ? "OK" : "ERROR",
      health: Math.random() < 0.05 ? "GOOD" : "BAD"
   };
};

// MARK: - Stats

const CPU_CORES = 8;

type PerCoreRow = StatsData["cpu"]["perCore"][number];

const buildStats = (): StatsData => {
   const perCore: PerCoreRow[] = Array.from({ length: CPU_CORES }, (_, idx) => {
      const user = roundTo(randFloat(5, 60), 1);
      const system = roundTo(randFloat(2, 18), 1);
      const jitter = roundTo(randFloat(-5, 5), 1);
      const idle = clamp(100 - user - system + jitter, 0, 100);
      return {
         core: `CPU${idx}`,
         user: toFixedStr(user, 1),
         system: toFixedStr(system, 1),
         idle: toFixedStr(idle, 1)
      };
   });

   let sumUser = 0;
   let sumSystem = 0;

   for (const c of perCore) {
      sumUser += Number(c.user);
      sumSystem += Number(c.system);
   }

   const coreCount = perCore.length || 1;
   const cpuUserN = sumUser / coreCount;
   const cpuSystemN = sumSystem / coreCount;
   const cpuIdleN = clamp(100 - cpuUserN - cpuSystemN, 0, 100);

   //memory/swap (mb)

   const memoryTotal = 32768;
   const memoryUsed = roundTo(randFloat(memoryTotal * 0.35, memoryTotal * 0.85), 1);
   const memoryCache = roundTo(randFloat(memoryTotal * 0.5, memoryTotal * 0.2), 1);
   const memoryFree = Math.max(memoryTotal - memoryUsed - memoryCache, memoryTotal * 0.05);

   const swapTotal = 8192;
   const swapUsed = roundTo(randFloat(swapTotal * 0.05, swapTotal * 0.04), 1);
   const swapFree = Math.max(swapTotal - swapUsed, swapTotal * 0.05);

   // sensors
   const sensors: StatsData["sensors"] = [
      { chip: "acpitz-acpi-0", label: "temp1", tempRange: [45, 101], high: 80, crit: 100 },
      { chip: "acpitz-acpi-0", label: "temp1", tempRange: [45, 101], high: 80, crit: 100 },
      { chip: "coretemp-isa-0000", label: "Package id 0", tempRange: [30, 101], high: 84, crit: 100 },
      ...Array.from({ length: 4 }, (_, i) => ({
         chip: "coretemp-isa-0000",
         label: `Core ${i}`,
         tempRange: [30, 101] as const,
         high: 84,
         crit: 100
      }))
   ].map(({ chip, label, tempRange, high, crit }) => ({
      chip,
      label,
      value: formatTemp(roundTo(randFloat(tempRange[0], tempRange[1]), 1), high, crit)
   }));

   return {
      loadAverage: {
         "1min": toFixedStr(randFloat(0.15, 2.5), 2),
         "5min": toFixedStr(randFloat(0.15, 2.2), 2),
         "15min": toFixedStr(randFloat(0.01, 2), 2)
      },
      cpu: {
         user: toFixedStr(cpuUserN, 1),
         system: toFixedStr(cpuSystemN, 1),
         idle: toFixedStr(cpuIdleN, 1),
         perCore
      },
      memory: {
         total: toFixedStr(memoryTotal, 1),
         used: toFixedStr(memoryUsed, 1),
         free: toFixedStr(memoryFree, 1),
         cache: toFixedStr(memoryCache, 1)
      },
      swap: {
         total: toFixedStr(swapTotal, 1),
         used: toFixedStr(swapUsed, 1),
         free: toFixedStr(swapFree, 1),
         availableMem: toFixedStr(memoryFree, 1)
      },
      sensors,
      hostname: "demo-server",
      generatedAt: new Date().toISOString()
   };
};

// MARK: - Env Sensors

const buildSensorTable = (): SensorData => {
   const now = new Date();
   return {
      success: true,
      data: {
         temperature: roundTo(randFloat(18, 32), 1),
         humidity: roundTo(randFloat(30, 70), 1),
         pressure: roundTo(randFloat(990, 1025), 1),
         airQuality: randInt(15, 100)
      },
      device: "demo-sensor-01",
      isOnline: Math.random() > 0.05,
      lastUpdate: now.toISOString()
   };
};

// MARK: - Processes

type ProcessRow = {
   pid: number;
   ppid: number;
   cpu: number;
   mem: number;
   elapsedSeconds: number;
   command: string;
};

const PROCESS_NAME_LIMITS: Record<string, number> = {
   //name: max instances, 0 for unlimited
   chrome: 5,
   code: 3,
   systemd: 1,
   "kiosk-app": 1,
   node: 4,
   nginx: 1,
   postgres: 1,
   "redis-server": 1,
   python: 2,
   bash: 0,
   ssh: 1,
   java: 2,
   docker: 1,
   cloudflared: 1
};

const PROCESS_NAMES = Object.keys(PROCESS_NAME_LIMITS);

const pickProcessName = (used: Record<string, number>): string => {
   for (let tries = 0; tries < 50; tries++) {
      const name = randomItem(PROCESS_NAMES);
      const limit = PROCESS_NAME_LIMITS[name] ?? 0;

      if (limit === 0) return name;
      const current = used[name] ?? 0;
      if (current < limit) {
         used[name] = current + 1;
         return name;
      }
   }
   return "bash";
};

const buildProcesses = (ppid: number): { processes: ProcessRow[]; generatedAt: string } => {
   const processCount = randInt(15, 75);
   const used: Record<string, number> = {};

   const processes: ProcessRow[] = Array.from({ length: processCount }, (_, idx) => ({
      pid: ppid + idx + 1,
      ppid,
      cpu: roundTo(randFloat(0, 100), 1),
      mem: roundTo(randFloat(0.1, 100), 1),
      elapsedSeconds: randInt(30, 86400 * 5),
      command: pickProcessName(used)
   }));

   return { processes, generatedAt: new Date().toISOString() };
};

// MARK: - Logs

const LOG_DETAILS: Record<LogType, { label: string; path: string; description: string }> = {
   next: {
      label: "Next.js server (combined)",
      path: "logs/combined-0.log",
      description: "Combined output of Next.js server (stdout and stderr)"
   },
   "next-out": {
      label: "Next.js server (stdout)",
      path: "logs/out-0.log",
      description: "Standard output of Next.js server"
   },
   "next-err": {
      label: "Next.js server (stderr)",
      path: "logs/err-0.log",
      description: "Error output of Next.js server"
   },
   ssh: {
      label: "SSH server",
      path: "/var/log/auth.log",
      description: "Output of SSH server"
   }
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatSshTimestamp = (date: Date): string => {
   const month = MONTHS[date.getMonth()] ?? "Jan";
   const day = String(date.getDate()).padStart(2, " ");
   const time = date.toTimeString().slice(0, 8);
   return `${month} ${day} ${time}`;
};

const buildNextCombinedLog = (count: number) => {
   const routes = ["/api/stats", "/api/disks", "/api/processes", "/api/logs", "/"];
   const methods = ["GET", "POST"];
   const levels = ["INFO", "WARN", "ERROR", "DEBUG"];
   const statuses = [200, 200, 200, 204, 304, 400, 401, 403, 404, 500, 502];

   let cursor = Date.now();

   const lines = Array.from({ length: count }, () => {
      cursor -= randInt(400, 2200);
      const date = new Date(cursor);
      const level = randomItem(levels);
      const status = level === "ERROR" ? randomItem([500, 502, 503, 504] as const) : randomItem(statuses);

      const method = randomItem(methods);
      const route = randomItem(routes);
      const duration = randInt(12, 980);
      const reqId = Math.random().toString(36).substring(2, 10);
      const cache = status === 200 && Math.random() < 0.3 ? "HIT" : "MISS";

      const extra =
         level === "ERROR"
            ? `trace=req-${reqId} stack="TypeError: Cannot read property 'haha' of undefined`
            : `trace=req-${reqId} cache=${cache}`;

      return `${date.toISOString()} [next] ${level} req-${reqId} "${method} ${route}" ${status} ${duration}ms ${extra}`;
   });

   return lines.reverse();
};

const buildNextStdoutLog = (count: number) => {
   const events = [
      "Server started on port 3000",
      "Connected to database",
      "Cache cleared successfully",
      "Hot reload triggered",
      "Telemetry disabled",
      "New user registered",
      "Session expired"
   ];

   let cursor = Date.now();

   const lines = Array.from({ length: count }, () => {
      cursor -= randInt(400, 2200);
      const date = new Date(cursor);
      const event = randomItem(events);

      return `${date.toISOString()} [next-out] INFO ${event}`;
   });

   return lines.reverse();
};

const buildNextStderrLog = (count: number) => {
     const errors = [
    "Unhandled rejection in /api/processes: ECONNREFUSED 127.0.0.1:5432",
    "Failed to render /dashboard: TypeError: Cannot read properties of null (reading 'cpu')",
    "API route /api/logs returned 500: ENOENT: no such file or directory, open '/var/log/auth.log'",
    "Middleware error for GET /api/disk: Unexpected token in JSON at position 12",
    "SSR crash on /: fetch failed (network timeout)",
    "Edge runtime error: SyntaxError: Unexpected token 'export'",
  ] as const;

   let cursor = Date.now();
   
   const lines = Array.from({ length: count }, () => {
      cursor -= randInt(400, 1800);
      const date = new Date(cursor);
      const error = randomItem(errors);
      const traceId = Math.random().toString(36).substring(2, 10);
      
      return `${date.toISOString()} [next-err] ERROR trace=req-${traceId} ${error}`;
   });
   
   return lines.reverse();
};

const buildSshLog = (count: number) => {
     const users = ["root", "kiosk"];
  const ips = ["10.0.0.12", "10.0.0.45", "192.168.1.22", "192.168.1.40", "172.17.0.5"] as const;

  let cursor = Date.now();
  
   const lines = Array.from({ length: count }, () => {
      cursor -= randInt(500, 3000);

        const outcome = randomItem(["Accepted password", "Accepted publickey", "Failed password"] as const);

      const date = new Date(cursor);
      const user = randomItem(users);
      const ip = randomItem(ips);
         const port = randInt(20000, 65000);
    const pid = randInt(1000, 9000);

      return `${formatSshTimestamp(date)} demo-server sshd[${pid}]: ${outcome} for ${user} from ${ip} port ${port} ssh2`;
   });
   
   return lines.reverse();
};

const LOG_BUILDERS: Record<LogType, (count: number) => string[]> = {
   next: buildNextCombinedLog,
   "next-out": buildNextStdoutLog,
   "next-err": buildNextStderrLog,
   ssh: buildSshLog
};

export const generateDemoLogData = (type: LogType) => {
   const baseCount: Record<LogType, number> = {
      next: 120,
      "next-out": 80,
      "next-err": 60,
      ssh: 90
   };

   const count = baseCount[type] ?? 60;
   const lines = LOG_BUILDERS[type](count);

   return {
      type,
      ...LOG_DETAILS[type],
      lines,
      count: lines.length,
      generatedAt: new Date().toISOString()
   };
}

// MARK: - Exports

export const generateDemoDiskData = (label: "system" | "storage") => buildDisk(label);
export const generateDemoStatsData = () => buildStats();
export const generateDemoSensorTableData = () => buildSensorTable();
export const generateDemoProcessData = () => buildProcesses(1000 + randInt(0, 8999));
 