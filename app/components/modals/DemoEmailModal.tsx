"use client";

import { useCallback } from "react";
import Image from "next/image";
import { Paperclip, Download, ExternalLink, Image as ImageIcon } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getTranslations, getFormattedTranslation } from "@/lib/translations";

const translations = getTranslations(process.env.NEXT_PUBLIC_LOCALE || undefined);

type Props = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
};

type Attachment = {
   name: string;
   url: string;
   kind: "image" | "file";
   size?: string;
};

export function DemoEmailModal({ open, onOpenChange }: Props) {
   const handleClose = useCallback(() => {
      onOpenChange(false);
   }, [onOpenChange]);  

   const openEmailInNewTab = useCallback(() => {
      window.open("/kiosk/demoEmail.html", "_blank", "noopener,noreferrer");
   }, []);

   const attachments: Attachment[] = [
      {
         name: "scan_4912.png",
         url: "/kiosk/scan_4912.png",
         kind: "image",
         size: "1.8 MB"
      }
   ];

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-5xl">
            <DialogHeader className="space-y-1">
               <DialogTitle>{translations.demoEmailModal.title}</DialogTitle>
               <DialogDescription>{translations.demoEmailModal.description}</DialogDescription>
            </DialogHeader>

            <div className="overflow-hidden rounded-2xl border border-border/60 bg-[#0f0f10] text-white shadow-2xl">
               <div className="flex flex-col gap-3 border-b border-white/10 bg-[#0b0b0c] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                     <Avatar className="bg-primary/20 text-primary">
                        <AvatarFallback className="bg-primary/20 text-sm font-semibold text-primary">SS</AvatarFallback>
                     </Avatar>
                     <div className="leading-tight">
                        <p className="text-sm font-semibold text-white">{translations.demoEmailModal.fromName}</p>
                        <p className="text-xs text-white/80">
                           {translations.demoEmailModal.scannedImage} <span className="font-medium">scan_4912.png</span>
                        </p>
                        <p className="text-[11px] text-white/60">{translations.demoEmailModal.to} CurrentUser</p>
                     </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                     <span className="rounded-md border border-white/10 px-2 py-1">{translations.demoEmailModal.inbox}</span>
                     <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={openEmailInNewTab}>
                           {translations.demoEmailModal.openInNewTab}
                        </Button>
                        <Button size="sm" onClick={handleClose}>
                           {translations.demoEmailModal.close}
                        </Button>
                     </div>
                  </div>
               </div>

               {/* Attachmentssss */}
               <div className="border-b border-white/10 bg-[#0b0b0c] px-4 py-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/80">
                     <Paperclip className="h-4 w-4" />
                     {translations.demoEmailModal.attachments}
                     <span className="text-white/50 font-normal">
                        {getFormattedTranslation(translations.demoEmailModal.attachmentsCount, {
                           count: String(attachments.length)
                        })}
                     </span>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-1">
                     {attachments.map((att) => (
                        <div
                           key={att.url}
                           className="min-w-[280px] flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                           <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                              {att.kind === "image" ? (
                                 <Image src={att.url} alt={att.name} fill className="object-cover" sizes="48px" />
                              ) : (
                                 <div className="flex h-full w-full items-center justify-center">
                                    <ImageIcon className="h-5 w-5 text-white/70" />
                                 </div>
                              )}
                           </div>

                           <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-white">{att.name}</p>
                              <p className="text-[11px] text-white/60">
                                 {att.size ?? "—"} • {att.kind.toUpperCase()}
                              </p>
                           </div>

                           <div className="flex items-center gap-2">
                              <Button variant="outline" size="icon" asChild>
                                 <a href={att.url} target="_blank" rel="noopener noreferrer" title={translations.demoEmailModal.open}>
                                    <ExternalLink className="h-4 w-4" />
                                 </a>
                              </Button>

                              <Button variant="outline" size="icon" asChild>
                                 <a href={att.url} download title={translations.demoEmailModal.download}>
                                    <Download className="h-4 w-4" />
                                 </a>
                              </Button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* BODY */}
               <div className="bg-[#18181a]">
                  <iframe
                     title={translations.demoEmailModal.iframeTitle}
                     src="/kiosk/demoEmail.html"
                     loading="lazy"
                     className="h-[70vh] min-h-[540px] w-full bg-muted"
                  />
               </div>
            </div>
         </DialogContent>
      </Dialog>
   );
}
