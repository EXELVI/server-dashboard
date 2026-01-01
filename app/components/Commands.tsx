import React from "react";

import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import { getTranslations } from "@/lib/translations";

const translations = getTranslations(process.env.NEXT_PUBLIC_LOCALE || undefined);

export default function Commands() {
   return (
      <div className="space-y-2">
         <div className="flex items-center justify-between">
            <h3 className="text-sm mb-2">{translations.commands.scanMenu}</h3>
            <KbdGroup>
               <Kbd>L</Kbd>
            </KbdGroup>
         </div>
         <div className="flex items-center justify-between">
            <h3 className="text-sm mb-2">{translations.commands.refreshData}</h3>
            <KbdGroup>
               <Kbd>U</Kbd>
            </KbdGroup>
         </div>
         <div className="flex items-center justify-between">
            <h3 className="text-sm mb-2">{translations.commands.openLogs}</h3>
            <KbdGroup>
               <Kbd>G</Kbd>
            </KbdGroup>
         </div>
         <div className="flex items-center justify-between">
            <h3 className="text-sm mb-2">{translations.commands.processes}</h3>
            <KbdGroup>
               <Kbd>O</Kbd>
            </KbdGroup>
         </div>
         <Separator className="my-2" />
         <div className="flex items-center justify-between">
            <h3 className="text-sm mb-2">{translations.commands.clearCache}</h3>
            <KbdGroup>
               <Kbd>R</Kbd>+<Kbd>P</Kbd>
            </KbdGroup>
         </div>
      </div>
   );
}
