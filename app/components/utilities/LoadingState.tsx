import React from 'react';
import { Loader2 } from 'lucide-react';
import { getTranslations } from '@/lib/translations';

const translations = getTranslations(process.env.NEXT_PUBLIC_LOCALE || undefined);

export const LoadingState: React.FC<{
   message?: string;
   height?: string;
}> = ({ message = translations.common.loading, height = "" }) => {
   return (
      <div className={`card card-sensor-table flex ${height} items-center justify-center`}>
         <div className="flex flex-col items-center justify-center gap-3 text-center" role="status" aria-live="polite">
            <Loader2 className="h-6 w-6 text-accent animate-spin" aria-hidden="true" />
            <div className="text-sm text-white">{message}</div>
         </div>
      </div>
   );
};

