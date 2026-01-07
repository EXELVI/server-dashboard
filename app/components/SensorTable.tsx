import React, { useMemo, FC } from "react";
import { format } from "date-fns";
import { Thermometer, Droplets, Wind, Gauge } from "lucide-react";
import { EmptyState } from "./utilities/EmptyState";

import { SensorTableProps, StatItemProps, SensorCardProps } from "@/app/types";
import { LoadingState } from "./utilities/LoadingState";
import { getTranslations } from "@/lib/translations";

const translations = getTranslations(process.env.NEXT_PUBLIC_LOCALE || undefined);
// Status configuration
const SENSOR_THRESHOLDS = {
   temperature: {
      warning: { min: 15, max: 35 },
      error: { min: 10, max: 40 }
   },
   humidity: {
      warning: { min: 30, max: 70 },
      error: { min: 20, max: 80 }
   },
   pressure: {
      warning: { min: 980, max: 1030 },
      error: { min: 950, max: 1050 }
   },
   airQuality: {
      error: 100,
      warning: 50
   }
} as const;

const getStatusByThreshold = (value: number, thresholds: { error: { min: number; max: number }; warning: { min: number; max: number } }): string => {
const { error, warning } = thresholds;
   if (value < error.min || value > error.max) return "text-error";
   if (value < warning.min || value > warning.max) return "text-warning";
   return "text-success";
}

const getAirQualityStatus = (value: number): string => {
   if (value > SENSOR_THRESHOLDS.airQuality.error) return "text-error";
   if (value > SENSOR_THRESHOLDS.airQuality.warning) return "text-warning";
   return "text-success";
}

 


const StatItem: FC<StatItemProps> = ({ icon, label, avg, min, max, unit = "" }) => (
   <div className="bg-surface-light rounded-lg p-3 border border-surface-hover">
      <div className="flex items-center gap-2 mb-2">
         <div className="w-5 h-5 flex-shrink-0">{icon}</div>
         <span className="text-xs font-medium text-text-secondary">{label}</span>
      </div>
      <div className="space-y-1.5">
         <div className="flex justify-between text-xs">
            <span className="text-text-tertiary">{translations.sensorTable.average}</span>
            <span className="font-mono font-semibold text-accent">
               {avg.toFixed(1)}
               {unit}
            </span>
         </div>
         <div className="flex justify-between text-xs">
            <span className="text-text-tertiary">{translations.sensorTable.min}</span>
            <span className="font-mono text-success">
               {min.toFixed(1)}
               {unit}
            </span>
         </div>
         <div className="flex justify-between text-xs">
            <span className="text-text-tertiary">{translations.sensorTable.max}</span>
            <span className="font-mono text-warning">
               {max.toFixed(1)}
               {unit}
            </span>
         </div>
      </div>
   </div>
);

const SensorCard: FC<SensorCardProps> = ({ icon, label, value, unit, status, displayUnit }) => (
   <div className="bg-surface-light rounded-lg p-3 border border-surface-hover flex flex-col justify-center items-center hover:bg-surface-hover transition-colors">
      <div className="w-6 h-6 mb-1.5 flex-shrink-0">{icon}</div>
      <div className={`text-2xl font-mono font-semibold ${status}`}>
         {value}
         {unit}
      </div>
      <div className="text-sm text-text-secondary text-center leading-tight">
         <div>{label}</div>
         {displayUnit && <div className="text-xs">({displayUnit})</div>}
      </div>
   </div>
);

const SensorTable: FC<SensorTableProps> = ({ data, loading }) => {
   if (loading) {
      return <LoadingState message={translations.sensorTable.loading} height="h-full" />;
   }

   if (!data?.success) {
      return <EmptyState icon={<Thermometer className="w-10 h-10 opacity-10 mb-4" />} />;
   }

   const { temperature, humidity, pressure, airQuality } = data.data;
   const { isOnline, device, lastUpdate } = data;
   const lastUpdateDate = useMemo(() => new Date(lastUpdate), [lastUpdate]);

   const temperatureStatus = useMemo(
      () => getStatusByThreshold(temperature, SENSOR_THRESHOLDS.temperature),
      [temperature]
   );
   
   const humidityStatus = useMemo(() => getStatusByThreshold(humidity, SENSOR_THRESHOLDS.humidity), [humidity]);

   const pressureStatus = useMemo(() => getStatusByThreshold(pressure, SENSOR_THRESHOLDS.pressure), [pressure]);

   const airQualityStatusClass = useMemo(() => getAirQualityStatus(airQuality), [airQuality]);

   return (
      <div className="card card-sensor-table overflow-hidden flex flex-col">
   

         <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
            <SensorCard
               icon={<Thermometer className="w-full h-full" strokeWidth={1.5} />}
               label={translations.sensorTable.temperature}
               value={temperature}
               unit="°C"
               displayUnit="°C"
               status={temperatureStatus}
            />
            <SensorCard
               icon={<Droplets className="w-full h-full" strokeWidth={1.5} />}
               label={translations.sensorTable.humidity}
               value={humidity}
               unit="%"
               displayUnit="%"
               status={humidityStatus}
            />
            <SensorCard
               icon={<Gauge className="w-full h-full" strokeWidth={1.5} />}
               label={translations.sensorTable.pressure}
               value={pressure}
               unit=""
               displayUnit="hPa"
               status={pressureStatus}
            />
            <SensorCard
               icon={<Wind className="w-full h-full" strokeWidth={1.5} />}
               label={translations.sensorTable.airQuality}
               value={airQuality}
               unit=""
               displayUnit="PPM"
               status={airQualityStatusClass}
            />
         </div>

         <div className="mt-2 text-xs text-text-tertiary text-center">
            <span className="text-gray-300">{translations.sensorTable.lastUpdate}</span> {format(lastUpdateDate, "HH:mm:ss")}
            <br />
            <span className="text-gray-300">{translations.sensorTable.device}</span> {device}
         </div>

         <div className="refresh-indicator bg-accent" />
      </div>
   );
};

export default SensorTable;
