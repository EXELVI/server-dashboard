import React from 'react';
import { getTranslations } from '@/lib/translations';

const translations = getTranslations(process.env.NEXT_PUBLIC_LOCALE || undefined);

export const OnlineStatus: React.FC<{ isOnline: boolean }> = ({ isOnline }) => (
   <div className={`flex items-center gap-2 text-xs ${isOnline ? "text-green-500" : "text-red-500"}`}>
       <span>{isOnline ? translations.common.online : translations.common.offline}</span>
      <div
         className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"} ${
            isOnline ? "animate-pulse" : ""
         }`}
      />

     
   </div>
);
