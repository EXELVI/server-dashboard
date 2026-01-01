"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { generateDemoLogData } from "../../services/demoData";
import { LogType } from "../../types";
import { LoadingState } from "../utilities/LoadingState";
import { getTranslations, getFormattedTranslation } from "@/lib/translations";

const translations = getTranslations(process.env.NEXT_PUBLIC_LOCALE || undefined);

type LogOption = {
   value: LogType;
   label: string;
   description: string;
   path: string;
};

const LOG_OPTIONS: LogOption[] = [
   {
      value: "next",
      label: translations.logDialog.options.next.label,
      description: translations.logDialog.options.next.description,
      path: "logs/combined-0.log"
   },
   {
      value: "next-out",
      label: translations.logDialog.options.nextOut.label,
      description: translations.logDialog.options.nextOut.description,
      path: "logs/out-0.log"
   },
   {
      value: "next-err",
      label: translations.logDialog.options.nextErr.label,
      description: translations.logDialog.options.nextErr.description,
      path: "logs/err-0.log"
   },
   {
      value: "ssh",
      label: translations.logDialog.options.ssh.label,
      description: translations.logDialog.options.ssh.description,
      path: "/var/log/auth.log"
   }, 
   {
      value: "xorg",
      label: translations.logDialog.options.xorg.label,
      description: translations.logDialog.options.xorg.description,
      path: "/var/log/Xorg.0.log"
   }
];

type Props = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   demoMode?: boolean;
};

export function LogDialog({ open, onOpenChange, demoMode }: Props) {
   const [selectedType, setSelectedType] = useState<LogType>("next");
   const [logLines, setLogLines] = useState<string[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
   const [count, setCount] = useState(0);
   const logScrollRef = useRef<HTMLDivElement>(null);

   const scrollToBottom = useCallback(() => {
      setTimeout(() => {
         logScrollRef.current?.scrollTo({
            top: logScrollRef.current.scrollHeight
         });
      }, 100);
   }, []);

   const selectedOption = useMemo(() => {
      return LOG_OPTIONS.find((option) => option.value === selectedType);
   }, [selectedType]);

   const fetchLogs = useCallback(
      async (type: LogType = selectedType) => {
         setLoading(true);
         setError(null);

         if (demoMode) {
            await new Promise((resolve) => setTimeout(resolve, 400));
            const demoData = generateDemoLogData(type);
            setLogLines(demoData.lines);
            setCount(demoData.lines.length);
            setLastUpdated(new Date());
            setLoading(false);
            scrollToBottom();
            return;
         }

         try {
            const response = await fetch(`/api/logs?type=${type}`);
            if (!response.ok) {
               const body = await response.json().catch(() => ({}));
               throw new Error(
                  body.error ||
                     getFormattedTranslation(translations.logDialog.fetchError, { status: String(response.status) })
               );
            }
            const data = await response.json();
            setLogLines(data.lines || []);
            setCount(data.count || data.lines?.length || 0);
            setLastUpdated(new Date());
            scrollToBottom();
         } catch (err: any) {
            setError(err.message || translations.logDialog.unknownError);
         } finally {
            setLoading(false);
         }
      },
      [selectedType, demoMode, scrollToBottom]
   );

   useEffect(() => {
      if (open) {
         fetchLogs(selectedType);
      }
   }, [open, fetchLogs, selectedType]);

   const changeLog = useCallback(
      (direction: "next" | "prev") => {
         const idx = LOG_OPTIONS.findIndex((option) => option.value === selectedType);
         if (idx === -1) return;
         const delta = direction === "next" ? 1 : -1;
         const nextIndex = (idx + delta + LOG_OPTIONS.length) % LOG_OPTIONS.length;
         setSelectedType(LOG_OPTIONS[nextIndex].value);
      },
      [selectedType]
   );

   const scrollLog = useCallback((delta: number) => {
      const el = logScrollRef.current;
      if (!el) return;
      el.scrollBy({ top: delta, behavior: "smooth" });
   }, []);

   useEffect(() => {
      if (!open) return;

      const handleKey = (e: KeyboardEvent) => {
         const active = document.activeElement as HTMLElement | null;
         if (
            active instanceof HTMLInputElement ||
            active instanceof HTMLTextAreaElement ||
            active?.getAttribute("role") === "combobox"
         ) {
            return;
         }

         switch (e.key) {
            case "ArrowUp":
               e.preventDefault();
               scrollLog(-100);
               break;
            case "ArrowDown":
               e.preventDefault();
               scrollLog(100);
               break;
            case "ArrowLeft":
               e.preventDefault();
               changeLog("prev");
               break;
            case "ArrowRight":
               e.preventDefault();
               changeLog("next");
               break;
         }
      };

      window.addEventListener("keydown", handleKey);
      return () => {
         window.removeEventListener("keydown", handleKey);
      };
   }, [open, scrollLog, changeLog]);

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            className="sm:max-w-4xl"
            onOpenAutoFocus={(event) => {
               event.preventDefault();
               logScrollRef.current?.focus();
               // scroll to bottom on open
               setTimeout(() => {
                  logScrollRef.current?.scrollTo({
                     top: logScrollRef.current.scrollHeight
                  });
               }, 100);
            }}>
            <DialogHeader>
               <DialogTitle>{translations.logDialog.title}</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-3">
               <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex-1">
                     <Select value={selectedType} onValueChange={(value) => setSelectedType(value as LogType)}>
                        <SelectTrigger tabIndex={-1}>
                           <SelectValue placeholder={translations.logDialog.selectPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                           {LOG_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                 <div className="flex flex-col">
                                    <span className="font-medium">{option.label}</span>
                                    <span className="text-xs text-muted-foreground">{option.description}</span>
                                 </div>
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                  <Button
                     variant="outline"
                     onClick={() => fetchLogs(selectedType)}
                     disabled={loading}
                     className="sm:w-auto">
                     {loading ? translations.common.updating : translations.logDialog.reload}
                  </Button>
               </div>

               <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {selectedOption && (
                     <>
                        <Badge variant="outline">{selectedOption.label}</Badge>
                        <Separator orientation="vertical" className="h-4" />
                        <span>{translations.logDialog.pathLabel} {selectedOption.path}</span>
                     </>
                  )}
                  {lastUpdated && (
                     <>
                        <Separator orientation="vertical" className="h-4" />
                        <span>
                           {getFormattedTranslation(translations.logDialog.updatedAt, {
                              time: lastUpdated.toLocaleTimeString()
                           })}{" "}
                           ({getFormattedTranslation(translations.logDialog.linesCount, { count: String(count) })})
                        </span>
                     </>
                  )}
               </div>

               <div className="relative">
                  <div
                     ref={logScrollRef}
                     className="h-[420px] overflow-y-auto rounded-md border bg-muted/40"
                     tabIndex={-1}>
                     <pre className="whitespace-pre-wrap p-4 text-xs font-mono leading-relaxed">
                        {error
                           ? `⚠️ ${error}`
                           : logLines.length
                           ? logLines.join("\n")
                           : translations.logDialog.noLines}
                     </pre>
                  </div>
                  {loading && <LoadingState message={translations.logDialog.loading} />}
               </div>
            </div>
         </DialogContent>
      </Dialog>
   );
}
