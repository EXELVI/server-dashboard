import React from "react";
import { Cpu, HardDrive, TriangleAlert } from "lucide-react";
import { LoadingState } from "./utilities/LoadingState";
import { EmptyState } from "./utilities/EmptyState";
import { getTranslations } from "@/lib/translations";

const translations = getTranslations(process.env.NEXT_PUBLIC_LOCALE || undefined);

interface Sensor {
   label: string;
   value: string;
}

interface SensorDataProps {
   sensors?: Sensor[];
   loading?: boolean;
}

const SensorData = ({ sensors, loading }: SensorDataProps) => {
   if (loading) {
      return <LoadingState message={translations.sensorData.loading} height="h-full" />;
   }

   if (!sensors || sensors.length === 0) {
      return (
         <EmptyState message={translations.sensorData.empty} height="h-full" />
      );
   }

   // Filter only temperature readings (excluding adapters)
   const tempSensors = sensors.filter((sensor) => sensor.value.includes("°C") && !sensor.label.includes("Adapter"));

   // Extract CPU core temperatures
   const cpuCoreSensors = tempSensors.filter(
      (sensor) => sensor.label.toLowerCase().includes("core") || sensor.label.toLowerCase().includes("package")
   );

   // Extract other temperature sensors
   const otherTempSensors = tempSensors.filter(
      (sensor) => !sensor.label.toLowerCase().includes("core") && !sensor.label.toLowerCase().includes("package")
   );

   // Parse temperature values
   const parseTemperature = (tempString: string) => {
      const match = tempString.match(/[-+]?(\d+(?:\.\d+)?)°C/);
      return match ? parseFloat(match[1]) : 0;
   };

   // Extract high and critical temperatures if available
   const getThresholds = (tempString: string) => {
      const highMatch = tempString.match(/high\s*=\s*[-+]?(\d+(?:\.\d+)?)°C/i);
      const critMatch = tempString.match(/crit\s*=\s*[-+]?(\d+(?:\.\d+)?)°C/i);

      return {
         high: highMatch ? parseFloat(highMatch[1]) : 70,
         crit: critMatch ? parseFloat(critMatch[1]) : 90
      };
   };

   const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

   const getTemperatureStyle = (temp: number, thresholds: { high: number; crit: number }) => {
      const crit = thresholds.crit || 1;
      const ratio = temp / crit;

      const warningRatio = 0.75; // >= 75% crit giallo
      const dangerRatio = 0.9; // >= 90% crit rosso

      const highRatio = thresholds.high / crit;
      const effectiveWarn = Math.max(warningRatio, Math.min(highRatio, dangerRatio - 0.01));

      if (ratio >= 1) {
         return {
            textClass: "text-red-700",
            bgGradient: "from-red-700/25 to-red-700/5",
            barColor: "bg-red-700",
            glowClass: "shadow-red-700/60",
            extraClass: "animate-pulse",
            danger: true
         };
      }

      if (ratio >= dangerRatio) {
         return {
            textClass: "text-red-400",
            bgGradient: "from-red-500/18 to-red-500/5",
            barColor: "bg-red-500",
            glowClass: "shadow-red-500/40",
            extraClass: ""
         };
      }

      if (ratio >= effectiveWarn) {
         return {
            textClass: "text-yellow-400",
            bgGradient: "from-yellow-500/18 to-yellow-500/5",
            barColor: "bg-yellow-500",
            glowClass: "shadow-yellow-500/40",
            extraClass: ""
         };
      }

      return {
         textClass: "text-emerald-500",
         bgGradient: "from-emerald-500/18 to-emerald-500/5",
         barColor: "bg-emerald-500",
         glowClass: "shadow-emerald-500/40",
         extraClass: ""
      };
   };

   const SensorCard = ({ sensor, icon: Icon }: { sensor: Sensor; icon: any }) => {
      const temp = parseTemperature(sensor.value);
      const thresholds = getThresholds(sensor.value);

      const style = getTemperatureStyle(temp, thresholds);
      const crit = thresholds.crit || 1;

      const pct = (v: number) => clamp((v / crit) * 100, 0, 100);
      const tempPct = pct(temp);
      const highPct = pct(thresholds.high);

      const labelPct = (p: number) => clamp(p, 8, 92);

      const position = Math.min(100, Math.max(0, (temp / thresholds.crit) * 100));

      return (
         <div
            className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${style.bgGradient} border border-white/10 p-2 transition-all hover:scale-[1.02] hover:shadow-lg ${style.glowClass}`}>
            <div className="flex items-start justify-between">
               <div className="flex items-center gap-1">
                  <Icon className={`w-4 h-4 ${style.textClass}`} />
                  <span className="text-xs font-medium text-text-secondary">{sensor.label}</span>
               </div>
               <div className={`text-1xl font-bold font-mono ${style.textClass} ${style.extraClass}`}>
                  {style.danger ? <TriangleAlert className="w-4 h-4 inline-block mr-1 mb-1" /> : null}
                  {temp.toFixed(1)}°C
               </div>
            </div>

            {/* Progress bar + markers */}
            <div className="mt-2">
               <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                     className={`absolute top-0 left-0 h-full ${style.barColor} rounded-full transition-all duration-300 ${style.extraClass}`}
                     style={{ width: `${tempPct}%` }}
                  />

                  {/* High marker */}
                  <div
                     className="absolute top-0 h-full w-[2px] bg-yellow-400/70"
                     style={{ left: `${highPct}%`, transform: "translateX(-50%)" }}
                  />

                  {/* Crit marker (fine barra) */}
                  <div className="absolute top-0 right-0 h-full w-[2px] bg-red-400/80" />
               </div>

               {/* Labels (posizionati) */}
               <div className="relative h-4 mt-1 text-[10px] text-text-secondary/60">
                  <span className="absolute left-0">0°C</span>

                  <span
                     className="absolute text-yellow-400/80"
                     style={{ left: `${labelPct(highPct)}%`, transform: "translateX(-50%)" }}>
                     {thresholds.high}°C
                  </span>

                  <span className="absolute right-0 text-red-500/70">{thresholds.crit}°C</span>
               </div>
            </div>
         </div>
      );
   };

   return (
      <div className="card card-sensors">
         {/* Header with stats */}
         <div className="flex items-center justify-between">
            <div className="">
               <h3 className="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  {translations.sensorData.cpuCores}
               </h3>
            </div>
         </div>

         {/* CPU Temperatures */}
         {cpuCoreSensors.length > 0 && (
            <div className="mb-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {cpuCoreSensors.map((sensor, idx) => (
                     <SensorCard key={idx} sensor={sensor} icon={Cpu} />
                  ))}
               </div>
            </div>
         )}

         {/* Other Temperatures */}
         {otherTempSensors.length > 0 && (
            <div>
               <h3 className="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  {translations.sensorData.systemComponents}
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {otherTempSensors.map((sensor, idx) => (
                     <SensorCard key={idx} sensor={sensor} icon={HardDrive} />
                  ))}
               </div>
            </div>
         )}

         <div className="refresh-indicator bg-error"></div>
      </div>
   );
};

export default SensorData;
