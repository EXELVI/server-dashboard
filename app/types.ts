// MARK: Stats
export interface DiskData {
   usePercent: string;
   used: string;
   avail: string;
   size: string;
   filesystem?: string;
   mountPoint?: string;
   ioStatus?: "OK" | "ERROR" | "UNKNOWN" | string;
   health?: "GOOD" | "BAD" | "UNKNOWN" | string;
}

export interface SensorReading {
   temperature: number;
   humidity: number;
   pressure: number;
   airQuality: number;
}

export interface SensorData {
   success: boolean;
   data: SensorReading;
   device: string;
   isOnline: boolean;
   lastUpdate: string;
}

export interface StatsData {
   loadAverage: {
      "1min": string;
      "5min": string;
      "15min": string;
   };
   cpu: {
      user: string;
      system: string;
      idle: string;
      perCore: Array<{
         core: string;
         user: string;
         system: string;
         idle: string;
      }>;
   };
   memory: {
      total: string;
      free: string;
      used: string;
      cache: string;
   };
   swap: {
      total: string;
      free: string;
      used: string;
      availableMem: string;
   };
   sensors: Array<{
      chip: string;
      label: string;
      value: string;
   }>;
   hostname: string;
   generatedAt?: string;
}
 
// MARK: Logs
export type LogType = 'next' | 'next-out' | 'next-err' | 'ssh' | 'xorg';

export type LogOption = {
   value: LogType;
   label: string;
   description: string;
   path: string;
};


// MARK: Env Sensors
export interface SensorReading {
   temperature: number;
   humidity: number;
   pressure: number;
   airQuality: number;
}

export interface SensorData {
   success: boolean;
   data: SensorReading;
   device: string;
   isOnline: boolean;
   lastUpdate: string;
}

export interface SensorTableProps {
   data: SensorData | undefined;
   loading: boolean;
}

export interface StatItemProps {
   icon: React.ReactNode;
   label: string;
   avg: number;
   min: number;
   max: number;
   unit?: string;
}

export interface SensorCardProps {
   icon: React.ReactNode;
   label: string;
   value: number;
   unit: string;
   status: string;
   displayUnit: string | undefined;
}

export type ProcessInfo = {
   pid: number;
   ppid: number;
   cpu: number;
   mem: number;
   elapsedSeconds: number;
   command: string;
};