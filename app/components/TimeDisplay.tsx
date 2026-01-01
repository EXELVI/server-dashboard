import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getTranslations } from '@/lib/translations';

const translations = getTranslations(process.env.NEXT_PUBLIC_LOCALE || undefined);

const TimeDisplay = ({ lastUpdated }: { lastUpdated: Date }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="flex flex-col justify-center items-center">
      <div className="text-4xl font-light tracking-wide mb-2 font-mono">
        {format(currentTime, 'HH:mm:ss')}
      </div>
      <div className="text-sm text-text-secondary">
        {format(currentTime, 'EEEE, MMMM d, yyyy')}
      </div>
      <div className="mt-4 text-xs text-text-tertiary font-light">
        {translations.timeDisplay.lastDataUpdate} {format(lastUpdated, 'HH:mm:ss')}
      </div>
      <div className="refresh-indicator bg-secondary"></div>
    </div>
    
  );
};

export default TimeDisplay;
