"use client";

import React, { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Label, Pie, PieChart } from "recharts";

import {
   ChartConfig,
   ChartContainer,
   ChartLegend,
   ChartLegendContent,
   ChartTooltip,
   ChartTooltipContent
} from "@/components/ui/chart";
import { getTranslations } from "@/lib/translations";

const translations = getTranslations(process.env.NEXT_PUBLIC_LOCALE || undefined);

const chartConfig = {
   user: {
      label: translations.cpu.user,
      color: "var(--chart-1)"
   },
   system: {
      label: translations.cpu.system,
      color: "var(--chart-2)"
   }
} satisfies ChartConfig;

interface CpuData {
   user: string;
   system: string;
   idle: string;
}

interface LoadAverage {
   "1min": string;
   "5min": string;
   "15min": string;
}

interface CpuUsageProps {
   data?: CpuData;
   loadAverage?: LoadAverage;
   loading?: boolean;
}

const CpuTooltip = ({ active, payload, label }: any) => {
   if (!active || !payload || payload.length === 0) return null;

   const user = payload.find((p: any) => p.name === "user")?.value ?? 0;
   const system = payload.find((p: any) => p.name === "system")?.value ?? 0;
   const total = user + system;

   return (
      <div className="rounded-lg border bg-background p-2 shadow-sm min-w-[140px]">
         {/* Orario */}
         <div className="text-xs text-muted-foreground mb-1">{label}</div>

         {/* Breakdown */}
         <div className="space-y-1 text-xs">
            <div className="flex justify-between">
               <div className="flex items-center gap-2">
                  <div className="h-3 w-3 shrink-0 rounded-[2px]" style={{ backgroundColor: "var(--chart-1)" }} />
                  <span className="text-muted-foreground">{translations.cpu.user}</span>
               </div>
               <span className="font-mono">{user.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 shrink-0 rounded-[2px]" style={{ backgroundColor: "var(--chart-2)" }} />
               <span className="text-muted-foreground">{translations.cpu.system}</span>
                </div>
               <span className="font-mono">{system.toFixed(1)}%</span>
            </div>
         </div>

         {/* Divider */}
         <div className="my-1 h-px bg-border" />

         {/* Totale */}
         <div className="flex justify-between text-sm font-semibold">
            <span>{translations.cpu.total}</span>
            <span className="font-mono">{total.toFixed(1)}%</span>
         </div>
      </div>
   );
};

const CpuUsage = ({ data, loadAverage, loading }: CpuUsageProps) => {
   const [cpuHistory, setCpuHistory] = useState<Array<{ time: string; user: number; system: number }>>([]);

   useEffect(() => {
      if (data) {
         setCpuHistory((prev) => {
            const now = new Date();
            const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;
            const newEntry = {
               time: timeStr,
               user: parseFloat(data.user as string),
               system: parseFloat(data.system as string)
            };
            const updated = [...prev, newEntry];
            return updated.length > 20 ? updated.slice(-20) : updated;
         });
      }
   }, [data]);

   const currentUsage = data ? (100 - parseFloat(data.idle as string)).toFixed(1) : "0";

   const donutData = [
      { name: translations.cpu.user, value: data ? parseFloat(data.user as string) : 0, fill: "var(--chart-1)" },
      { name: translations.cpu.system, value: data ? parseFloat(data.system as string) : 0, fill: "var(--chart-2)" },
      { name: translations.cpu.idle, value: data ? parseFloat(data.idle as string) : 100, fill: "var(--chart-unused)" }
   ];

   return (
      <div className="grid grid-cols-[180px_1fr] gap-1 h-full">
         <div className="flex flex-col justify-center items-center gap-4">
            <div className="w-full">
                  <ChartContainer
                  config={{
                     user: { label: translations.cpu.user, color: "var(--chart-1)" },
                     system: { label: translations.cpu.system, color: "var(--chart-2)" },
                     idle: { label: translations.cpu.idle, color: "var(--chart-unused)" }
                  }}
                  className="w-full h-[160px]">
                  <PieChart margin={{ top: 8, bottom: 8 }}>
                     <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                     <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={80}
                        strokeWidth={0}>
                        <Label
                           content={({ viewBox }) => {
                              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                 return (
                                    <text
                                       x={viewBox.cx}
                                       y={viewBox.cy ? viewBox.cy - 3 : 0}
                                       textAnchor="middle"
                                       dominantBaseline="middle">
                                       <tspan
                                          x={viewBox.cx}
                                          y={viewBox.cy ? viewBox.cy  : 0}
                                          className="fill-foreground text-2xl font-bold">
                                          {currentUsage}%
                                       </tspan>
                                       <tspan
                                          x={viewBox.cx}
                                          y={(viewBox.cy || 0) + 17}
                                          className="fill-muted-foreground text-xs">
                                          {translations.cpu.cpuUsage}
                                       </tspan>
                                    </text>
                                 );
                              }
                           }}
                        />
                     </Pie>
                  </PieChart>
               </ChartContainer>
            </div>

            {/* Load Average */}
            <div className="w-full">
               <div className="text-xs text-muted-foreground mb-2 font-semibold">{translations.cpu.loadAvg}</div>
               <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted p-2 rounded text-center">
                     <div className="text-xs text-muted-foreground">1m</div>
                     <div className="font-mono text-sm font-semibold">{loadAverage?.["1min"] || "0.00"}</div>
                  </div>
                  <div className="bg-muted p-2 rounded text-center">
                     <div className="text-xs text-muted-foreground">5m</div>
                     <div className="font-mono text-sm font-semibold">{loadAverage?.["5min"] || "0.00"}</div>
                  </div>
                  <div className="bg-muted p-2 rounded text-center">
                     <div className="text-xs text-muted-foreground">15m</div>
                     <div className="font-mono text-sm font-semibold">{loadAverage?.["15min"] || "0.00"}</div>
                  </div>
               </div>
            </div>
         </div>

         <div className="w-full">
            {!loading && cpuHistory.length > 0 && (
               <ChartContainer config={chartConfig} className="w-full h-full aspect-auto">
                  <AreaChart data={cpuHistory}>
                     <defs>
                        <linearGradient id="fillUser" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="var(--color-user)" stopOpacity={0.8} />
                           <stop offset="95%" stopColor="var(--color-user)" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="fillystem" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="var(--color-system)" stopOpacity={0.8} />
                           <stop offset="95%" stopColor="var(--color-system)" stopOpacity={0.1} />
                        </linearGradient>
                     </defs>
                     <CartesianGrid vertical={false} />
                     <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
                     <YAxis min={0} max={100} tickLine={false} axisLine={false} tickMargin={8} domain={[0, 100]} />
                     <ChartTooltip cursor={false} content={<CpuTooltip indicator="dot" />} />
                     <Area dataKey="user" type="natural" fill="url(#fillUser)" stroke="var(--color-user)" stackId="a" />
                     <Area
                        dataKey="system"
                        type="natural"
                        fill="url(#fillSystem)"
                        stroke="var(--color-system)"
                        stackId="a"
                     />
                     <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
               </ChartContainer>
            )}
         </div>
      </div>
   );
};

export default CpuUsage;
