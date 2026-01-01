"use client";

import React from "react";
import { EmptyState } from "./utilities/EmptyState";
import { HardDrive } from "lucide-react";
import { LoadingState } from "./utilities/LoadingState";
import { getTranslations } from "@/lib/translations";

const translations = getTranslations(process.env.NEXT_PUBLIC_LOCALE || undefined);

interface DiskInfo {
   usePercent: string;
   used: string;
   avail: string;
   size: string;
   filesystem?: string;
   mountPoint?: string;
   ioStatus?: "OK" | "ERROR" | "UNKNOWN" | string;
   health?: "GOOD" | "BAD" | "UNKNOWN" | string;
}

interface DiskUsageProps {
   mainDisk?: DiskInfo;
   storageDisk?: DiskInfo;
   loading?: boolean;
}

const DiskUsage = ({ mainDisk, storageDisk, loading }: DiskUsageProps) => {
   if (loading) {
      return (
         <LoadingState message={translations.disk.loading} />
      );
   }

   if (!mainDisk && !storageDisk) {
      return (
         <EmptyState message={translations.disk.empty} icon={<HardDrive className="w-10 h-10 opacity-10 mb-4" />} />
      );
   }

   // Parse disk data percent values
   const mainDiskPercent = mainDisk ? parseInt(mainDisk.usePercent.replace("%", "")) : 0;
   const storageDiskPercent = storageDisk ? parseInt(storageDisk.usePercent.replace("%", "")) : 0;

   return (
      <div className="card">
         <div className="flex flex-col h-full">
            <div className="grid gap-6">
               {mainDisk ? (   <DiskItem
                  label={translations.disk.system}
                  usedSpace={mainDisk?.used || "0G"}
                  availSpace={mainDisk?.avail || "0G"}
                  totalSpace={mainDisk?.size || "0G"}
                  percent={mainDiskPercent}
                  criticalThreshold={90}
                  filesystem={mainDisk?.filesystem}
                  mountPoint={mainDisk?.mountPoint}
                  ioStatus={mainDisk?.ioStatus}
                  health={mainDisk?.health}
               />) : <EmptyState message={translations.disk.noSystem} icon={<HardDrive className="w-10 h-10 opacity-10 mb-4" />} height="h-28" />}

               {storageDisk ? (<DiskItem
                  label={translations.disk.storage}
                  usedSpace={storageDisk?.used || "0T"}
                  availSpace={storageDisk?.avail || "0T"}
                  totalSpace={storageDisk?.size || "0T"}
                  percent={storageDiskPercent}
                  criticalThreshold={90}
                  filesystem={storageDisk?.filesystem}
                  mountPoint={storageDisk?.mountPoint}
                  ioStatus={storageDisk?.ioStatus}
                  health={storageDisk?.health}
               />) : <EmptyState message={translations.disk.noStorage} icon={<HardDrive className="w-10 h-10 opacity-10 mb-4" />} height="h-28" />}
            </div>
         </div>
      </div>
   );
};

interface DiskItemProps {
   label: string;
   usedSpace: string;
   availSpace: string;
   totalSpace: string;
   percent: number;
   criticalThreshold: number;

   // NEW
   filesystem?: string;
   mountPoint?: string;
   ioStatus?: string;
   health?: string;
}

const DiskItem = ({
   label,
   usedSpace,
   availSpace,
   totalSpace,
   percent,
   criticalThreshold,
   filesystem,
   mountPoint,
   ioStatus,
   health
}: DiskItemProps) => {
   const getLevelColor = () =>
      percent >= criticalThreshold ? "bg-destructive" : percent >= 70 ? "bg-yellow-500" : "bg-green-500";

   return (
      <div className="space-y-1">
         <div className="flex justify-between items-center">
            <div className="font-mono text-sm font-semibold">{label}</div>
            <div className="text-sm font-mono font-semibold">{percent}%</div>
         </div>

         <div className="bg-muted h-6 rounded-full overflow-hidden relative">
            <div
               className={`h-full ${getLevelColor()} transition-all duration-300`}
               style={{ width: `${percent}%` }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
               <span className="text-xs font-mono tracking-wider text-foreground/80">
                  {usedSpace} / {totalSpace}
               </span>
            </div>
         </div>

         <div className="flex justify-between text-xs text-muted-foreground">
            <span>{translations.disk.used}: {usedSpace}</span>
            <span>{translations.disk.available}: {availSpace}</span>
            <span>{translations.disk.total}: {totalSpace}</span>
         </div>
         <DiskMeta filesystem={filesystem} mountPoint={mountPoint} ioStatus={ioStatus} health={health} />
      </div>
   );
};

const DiskMeta = ({
   filesystem,
   mountPoint,
   ioStatus,
   health
}: {
   filesystem?: string;
   mountPoint?: string;
   ioStatus?: string;
   health?: string;
}) => {
   const ioBadge =
      ioStatus?.toUpperCase() === "OK"
         ? "bg-green-500/15 text-green-600 dark:text-green-400"
         : ioStatus?.toUpperCase() === "ERROR"
         ? "bg-destructive/15 text-destructive"
         : "bg-muted text-muted-foreground";

   const healthBadge =
      health?.toUpperCase() === "GOOD"
         ? "bg-green-500/15 text-green-600 dark:text-green-400"
         : health?.toUpperCase() === "BAD"
         ? "bg-destructive/15 text-destructive"
         : "bg-muted text-muted-foreground";

   const Card = ({ title, value, right }: { title: string; value: React.ReactNode; right?: React.ReactNode }) => (
      <div className="rounded-xl border bg-card/40 p-3 backdrop-blur-sm transition hover:bg-card/60">
         <div className="flex items-start justify-between gap-2">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{title}</div>
            {right}
         </div>
         <div className="mt-1 font-mono text-sm truncate">{value}</div>
      </div>
   );

   const Badge = ({ children, className }: { children: React.ReactNode; className: string }) => (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}>
         {children}
      </span>
   );

   return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
         <Card title={translations.disk.filesystem} value={filesystem || "—"} />
         <Card title={translations.disk.mountPoint} value={mountPoint || "—"} />
         <Card
            title={translations.disk.ioStatus}
            value={ioStatus || translations.disk.unknown}
            right={<Badge className={ioBadge}>{(ioStatus || translations.disk.unknown).toUpperCase()}</Badge>}
         />
         <Card
            title={translations.disk.health}
            value={health || translations.disk.unknown}
            right={<Badge className={healthBadge}>{(health || translations.disk.unknown).toUpperCase()}</Badge>}
         />
      </div>
   );
};

interface DiskCellProps {
   index: number;
}

const DiskCell = ({ index }: DiskCellProps) => {
   const getBgColor = () => {
      if (index === 0) return "bg-chart-1 opacity-30";
      if (index === 1) return "bg-chart-2 opacity-30";
      if (index === 2) return "bg-chart-3 opacity-30";
      if (index === 3) return "bg-chart-4 opacity-30";
      return "bg-muted";
   };

   const getSymbol = () => {
      if (index === 0) return "○";
      if (index === 1) return "◇";
      if (index === 2) return "□";
      if (index === 3) return "△";
      return "◌";
   };

   return (
      <div className={`aspect-square rounded ${getBgColor()} flex items-center justify-center`}>
         <div className="text-3xl opacity-20 text-center leading-none">{getSymbol()}</div>
      </div>
   );
};

export default DiskUsage;
