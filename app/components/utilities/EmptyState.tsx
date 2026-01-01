import React from 'react';
import { getTranslations } from '@/lib/translations';

const translations = getTranslations(process.env.NEXT_PUBLIC_LOCALE || undefined);

export const EmptyState: React.FC<{ title?: string; message?: string, icon?: React.ReactNode, height?: string }> = ({
   title,
    message = translations.common.noData,
   icon,
   height = "h-full"
}) => {
   return ( 
      <div className={`card card-sensor-table flex flex-col items-center justify-center text-center py-16 ${height}`}>
         {title && <h2 className="text-md font-semibold mb-4">{title}</h2>}
         {icon && <div className="mb-2">{icon}</div>}
         <div className="text-text-secondary">{message}</div>
         <div className="refresh-indicator bg-accent"></div>
      </div>
   );
};
   
