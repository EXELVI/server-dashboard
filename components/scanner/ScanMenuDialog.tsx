"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Search, Clipboard } from "lucide-react";
import { getTranslations } from "@/lib/translations";

const translations = getTranslations(process.env.NEXT_PUBLIC_LOCALE || undefined);

export function ScanMenuDialog(props: {
   open: boolean;
   onOpenChange: (v: boolean) => void;

   scanning: boolean;
   scanStatus: string;
   scannedImageUrl: string | null;

   onStartScan: () => void;
   onShare: () => void;

   demoMode?: boolean;
}) {
   const { open, onOpenChange, scanning, scanStatus, scannedImageUrl, onStartScan, onShare, demoMode } = props;

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent style={{ maxWidth: "50vw", width: "100%", height: "800px" }} className="flex flex-col">
            <DialogHeader>
               <DialogTitle>{translations.scanMenu.title}</DialogTitle>
               {demoMode && (
                  <p className="text-xs text-amber-500">{translations.scanMenu.demoActive}</p>
               )}
            </DialogHeader>

            <div className="flex-1 flex gap-4 min-h-0">
               <div className="flex-1 flex flex-col gap-3 overflow-auto">
                  <h3 className="font-semibold text-sm">{translations.scanMenu.availableCommands}</h3>
                  <Button onClick={onStartScan} disabled={scanning} className="w-full justify-start">
                     {scanning
                        ? translations.scanMenu.scanning
                        : demoMode
                        ? translations.scanMenu.startDemoScan
                        : translations.scanMenu.startScan}{" "}
                     <Kbd>K</Kbd>
                  </Button>

                  <Button
                     variant="outline"
                     onClick={() => onOpenChange(false)}
                     disabled={scanning}
                     className="w-full justify-start">
                     {translations.scanMenu.closeMenu} <Kbd>L</Kbd>
                  </Button>
               </div>

               <div className="flex-1 border-l pl-4 flex flex-col items-center justify-center bg-muted/30 rounded">
                  {scanning ? (
                     <div className="text-center space-y-4">
                        <div className="text-3xl flex justify-center">
                           <Search />
                        </div>
                        <div className="text-sm text-muted-foreground max-w-xs">{scanStatus}</div>
                     </div>
                  ) : (
                     <>
                        {scannedImageUrl ? (
                           <div className="flex flex-col items-center">
                              <img
                                 src={scannedImageUrl}
                                 alt={translations.scanMenu.scannedDocumentAlt}
                                 className="max-h-[600px] w-auto mb-4"
                              />
                              <Button variant="outline" onClick={onShare} className="w-full">
                                 {translations.scanMenu.sendEmailQr} <Kbd>D</Kbd>
                              </Button>
                              <span className="text-sm text-muted-foreground mt-2">
                                 <Kbd>F</Kbd> {translations.scanMenu.fullscreenHint}
                              </span>
                           </div>
                        ) : (
                           <div className="text-center space-y-2">
                              <div className="text-4xl flex justify-center">
                                 <Clipboard />
                              </div>
                              <p className="text-sm text-muted-foreground">{translations.scanMenu.ready}</p>
                              {scanStatus && <div className="text-sm text-muted-foreground max-w-xs">{scanStatus}</div>}
                           </div>
                        )}
                     </>
                  )}
               </div>
            </div>
         </DialogContent>
      </Dialog>
   );
}
