"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generateDemoProcessData } from "../../services/demoData";
import { LoadingState } from "../utilities/LoadingState";
import { EmptyState } from "../utilities/EmptyState";
import { getTranslations, getFormattedTranslation } from "@/lib/translations";

const translations = getTranslations(process.env.NEXT_PUBLIC_LOCALE || undefined);

type ProcessInfo = {
   pid: number;
   ppid: number;
   cpu: number;
   mem: number;
   elapsedSeconds: number;
   command: string;
};

type Props = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   demoMode?: boolean;
};

const formatDuration = (seconds: number) => {
   const safeSeconds = Math.max(0, Math.floor(seconds));
   const days = Math.floor(safeSeconds / 86400);
   const hours = Math.floor((safeSeconds % 86400) / 3600);
   const minutes = Math.floor((safeSeconds % 3600) / 60);
   const secs = safeSeconds % 60;
   const hhmmss = [hours, minutes, secs].map((v) => v.toString().padStart(2, "0")).join(":");
   return days > 0 ? `${days}d ${hhmmss}` : hhmmss;
};

type sortKey = keyof ProcessInfo;
const sortLabels: Record<sortKey, string> = {
   pid: translations.processDialog.pid,
   ppid: translations.processDialog.ppid,
   cpu: translations.processDialog.cpuPercent,
   mem: translations.processDialog.memPercent,
   elapsedSeconds: translations.processDialog.elapsedTime,
   command: translations.processDialog.command
};

export function ProcessDialog({ open, onOpenChange, demoMode }: Props) {
   const [processes, setProcesses] = useState<ProcessInfo[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
   const [query, setQuery] = useState("");
   const [sortBy, setSortBy] = useState<sortKey>("cpu");
   const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

   const fetchProcesses = useCallback(async () => {
      setLoading(true);
      setError(null);

      if (demoMode) {
         await new Promise((resolve) => setTimeout(resolve, 500));
         const demoData = generateDemoProcessData();
         setProcesses(demoData.processes);
         setLastUpdated(new Date(demoData.generatedAt));
         setLoading(false);
      } else {
         try {
            const res = await fetch("/api/processes");

            if (!res.ok) {
               const payload = await res.json().catch(() => ({}));
               throw new Error(payload.error || translations.processDialog.loading);
            }

            const payload = await res.json();
            setProcesses(payload.processes);
            setLastUpdated(payload.generatedAt ? new Date(payload.generatedAt) : new Date());
         } catch (err: any) {
            setProcesses([]);
            setError(err.message || translations.scanner.connectionErrorEmail);
         } finally {
            setLoading(false);
         }
      }
   }, []);

   useEffect(() => {
      if (open) {
         fetchProcesses();
      }
   }, [open, fetchProcesses]);

   const sortedProcesses = useMemo(() => {
      let list = processes;

      if (query.trim()) {
         const q = query.trim().toLowerCase();
         list = list.filter((proc) => proc.command.toLowerCase().includes(q) || proc.pid.toString() === q);
      }

      return [...list].sort((a, b) => {
         const valA = a[sortBy];
         const valB = b[sortBy];

         if (typeof valA === "string") {
            return sortDir === "asc" ? valA.localeCompare(valB as string) : (valB as string).localeCompare(valA);
         }

         return sortDir === "asc" ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      });
   }, [processes, query, sortBy, sortDir]);

   const toggleSort = (key: sortKey) => {
      if (sortBy === key) {
         setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
         setSortBy(key);
         setSortDir("desc");
      }
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="w-[98vw] max-w-none sm:!max-w-[1400px] lg:!max-w-[1600px]">
            <DialogHeader>
               <DialogTitle>{translations.processDialog.title}</DialogTitle>
               <DialogDescription>{translations.processDialog.description}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
               <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <Input
                     value={query}
                     onChange={(e) => setQuery(e.target.value)}
                     placeholder={translations.processDialog.placeholder}
                     className="sm:max-w-xs"
                  />
                  <div className="flex items-center gap-2">
                     <Button variant="outline" onClick={fetchProcesses} disabled={loading}>
                        {loading ? translations.processDialog.updating : translations.processDialog.update}
                     </Button>
                     <Badge variant="outline">
                        {translations.processDialog.badgePrefix} {processes.length || "0"} {translations.processDialog.badgeBy}{" "}
                        {sortLabels[sortBy] || sortBy.toUpperCase()}
                     </Badge>
                     {lastUpdated && (
                        <span className="text-xs text-muted-foreground">
                           {getFormattedTranslation(translations.processDialog.updatedAt, {
                              time: lastUpdated.toLocaleTimeString()
                           })}
                        </span>
                     )}
                  </div>
               </div>

               <div className="rounded-md border overflow-hidden">
                  <div className="max-h-[480px] overflow-auto">
                     <Table>
                        <TableHeader className="bg-muted/50">
                           <TableRow>
                              <TableHead
                                 className="w-[90px] cursor-pointer select-none"
                                 onClick={() => toggleSort("pid")}>
                                 {translations.processDialog.pid} {sortBy === "pid" && (sortDir === "asc" ? "▲" : "▼")}
                              </TableHead>
                              <TableHead
                                 className="w-[90px] cursor-pointer select-none"
                                 onClick={() => toggleSort("ppid")}>
                                 {translations.processDialog.ppid} {sortBy === "ppid" && (sortDir === "asc" ? "▲" : "▼")}
                              </TableHead>
                              <TableHead
                                 className="w-[90px] cursor-pointer select-none"
                                 onClick={() => toggleSort("cpu")}>
                                 {translations.processDialog.cpuPercent} {sortBy === "cpu" && (sortDir === "asc" ? "▲" : "▼")}
                              </TableHead>
                              <TableHead
                                 className="w-[90px] cursor-pointer select-none"
                                 onClick={() => toggleSort("mem")}>
                                 {translations.processDialog.memPercent} {sortBy === "mem" && (sortDir === "asc" ? "▲" : "▼")}
                              </TableHead>
                              <TableHead
                                 className="w-[120px] cursor-pointer select-none"
                                 onClick={() => toggleSort("elapsedSeconds")}>
                                 {translations.processDialog.elapsedTime} {sortBy === "elapsedSeconds" && (sortDir === "asc" ? "▲" : "▼")}
                              </TableHead>
                              <TableHead>{translations.processDialog.command}</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {loading && (
                              <TableRow>
                                 <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                                    <LoadingState message={translations.processDialog.loading} />
                                 </TableCell>
                              </TableRow>
                           )}

                           {error && !loading && (
                              <TableRow>
                                 <TableCell colSpan={6} className="text-center text-sm text-red-600">
                                    {error}
                                 </TableCell>
                              </TableRow>
                           )}

                           {!loading && !error && sortedProcesses.length === 0 && (
                              <TableRow>
                                 <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                                  <EmptyState message={translations.processDialog.empty} />
                                 </TableCell>
                              </TableRow>
                           )}

                           {!loading &&
                              !error &&
                              sortedProcesses.map((proc) => (
                                 <TableRow key={`${proc.pid}-${proc.command}`}>
                                    <TableCell className="font-mono text-xs">{proc.pid}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                       {proc.ppid}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{proc.cpu.toFixed(1)}</TableCell>
                                    <TableCell className="font-mono text-xs">{proc.mem.toFixed(1)}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                       {formatDuration(proc.elapsedSeconds)}
                                    </TableCell>
                                    <TableCell className="text-sm">{proc.command}</TableCell>
                                 </TableRow>
                              ))}
                        </TableBody>
                     </Table>
                  </div>
               </div>
            </div>
         </DialogContent>
      </Dialog>
   );
}
