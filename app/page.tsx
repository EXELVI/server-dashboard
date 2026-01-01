"use client";

const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE ? process.env.NEXT_PUBLIC_DEMO_MODE.toLowerCase() === "true" : false;
 
console.log("Demo Mode:", process.env.NEXT_PUBLIC_DEMO_MODE);

// MARK: - Imports
import React, { useCallback, useEffect, useRef, useState } from "react";
import fetchData from "./services/dataService";
import Header from "./components/Header";
import CpuUsage from "./components/CpuUsage";
import MemoryUsage from "./components/MemoryUsage";
import SensorData from "./components/SensorData";
import DiskUsage from "./components/DiskUsage";
import TimeDisplay from "./components/TimeDisplay";
import SensorTable from "./components/SensorTable";
import { LogDialog } from "./components/modals/LogDialog";
import { ProcessDialog } from "./components/modals/ProcessDialog";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

//Scanner
import { Toaster, toast } from "sonner";
import { useScanner } from "@/hooks/useScanner";
import { ScanMenuDialog } from "@/components/scanner/ScanMenuDialog";
import { ShareScanDialog } from "@/components/scanner/ShareScanDialog";
import { EmailDialog } from "@/components/scanner/EmailDialog";
import { EmailConfirmDialog } from "@/components/scanner/EmailConfirmDialog";
import { DemoEmailModal } from "./components/modals/DemoEmailModal";
import { generateDemoDiskData, generateDemoSensorTableData, generateDemoStatsData } from "./services/demoData";
import { DiskData, SensorData as SensorSnapshot, StatsData } from "./types";
import { OnlineStatus } from "./components/utilities/OnlineStatus";
import { LoadingState } from "./components/utilities/LoadingState";
import Commands from "./components/Commands";
import { getTranslations } from "@/lib/translations";

const translations = getTranslations(process.env.NEXT_PUBLIC_LOCALE || undefined);

// MARK: - Main Component
export default function App() {
   const [diskData, setDiskData] = useState<DiskData | null>(null);
   const [diskData4TB, setDiskData4TB] = useState<DiskData | null>(null);
   const [sensorTableData, setSensorTableData] = useState<SensorSnapshot | undefined>(undefined);
   const [statsData, setStatsData] = useState<StatsData | null>(null);
   const [lastUpdated, setLastUpdated] = useState(new Date());
   const [loading, setLoading] = useState(true);
   const [openLogDialog, setOpenLogDialog] = useState(false);
   const [openProcessDialog, setOpenProcessDialog] = useState(false);
   const pressedKeys = useRef<Set<string>>(new Set());

   const scanner = useScanner({
      mockScan: demoMode
   });

   // MARK: - Data Fetching
   const updateData = useCallback(async () => {
      try {
         if (demoMode) {
            setDiskData(generateDemoDiskData("system"));
            setDiskData4TB(generateDemoDiskData("storage"));
            setSensorTableData(generateDemoSensorTableData());
            setStatsData(generateDemoStatsData());
            setLastUpdated(new Date());
            setLoading(false);
            return;
         }

         const [disk, disk4TB, stats, sensorTable] = await Promise.all([
            fetchData("/api/disk"),
            fetchData("/api/disk?disk=/mnt/4tb"),
            fetchData("/api/stats"),
            fetchData("https://exelvi.xyz/api/sensor/current")
         ]);

         setDiskData(disk);
         setDiskData4TB(disk4TB);
         setSensorTableData(sensorTable);
         setStatsData(stats);
         setLastUpdated(new Date());
         setLoading(false);
      } catch (error) {
         console.error("Error fetching data:", error);
         if (!demoMode) {
            setLoading(false);
         }
      }
   }, [demoMode]);

   useEffect(() => {
      updateData();

      const interval = setInterval(() => {
         updateData();
      }, 10000);

      return () => clearInterval(interval);
   }, [updateData]);

   const handleClearCache = useCallback(async () => {
      try {
         toast.info(translations.page.cacheClearing);
         if (!demoMode) {
            const res = await fetch("/api/cache", { method: "POST" });
            const payload = await res.json().catch(() => ({}));

            if (!res.ok || !payload?.success) {
               throw new Error(payload?.error || translations.page.cacheClearingError);
            }

            toast.success(payload?.message || translations.page.cacheCleared);
         } else {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            toast.success(translations.page.cacheClearedDemo);
         }
      } catch (err) {
         toast.error(err instanceof Error ? err.message : translations.page.cacheClearingError);
      }
   }, []);

   // MARK: - Keyboard shortcuts
   useEffect(() => {
      const handleKeyDown = async (e: KeyboardEvent) => {
         const isTypingInInput =
            document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement;

         if (isTypingInInput) return;

         const key = e.key.toLowerCase();

         if (key === "r" || key === "p") {
            pressedKeys.current.add(key);
            if (pressedKeys.current.has("r") && pressedKeys.current.has("p")) {
               e.preventDefault();
               handleClearCache();
            }
            return;
         }

         // Refresh data with "U" key
         if (key === "u") {
            e.preventDefault();
            try {
               toast.info(translations.page.updatingData);
               await updateData();
               toast.success(translations.page.dataUpdated);
            } catch {
               toast.error(translations.page.updateFailed);
            }
         }

         // Open logs dialog with "G" key
         if (key === "g") {
            e.preventDefault();
            setOpenLogDialog(true);
         }

         // Open process dialog with "O" key
         if (key === "o") {
            e.preventDefault();
            setOpenProcessDialog(true);
         }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
         const key = e.key.toLowerCase();
         if (key === "r" || key === "p") {
            pressedKeys.current.delete(key);
         }
      };

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      return () => {
         window.removeEventListener("keydown", handleKeyDown);
         window.removeEventListener("keyup", handleKeyUp);
      };
   }, [updateData, handleClearCache]);

   // MARK: - Render
   if (loading) {
      return (
         <LoadingState message={translations.common.loadingSystemData} height="min-h-screen h-full"/>
      );
   }

   return (
      <>
         <Toaster position="top-right" />

         <EmailDialog
            open={scanner.openEmail}
            onOpenChange={scanner.setOpenEmail}
            emailSending={scanner.emailSending}
            onSend={(email) => scanner.sendWithEmail(email)}
         />

         <EmailConfirmDialog
            open={scanner.showEmailConfirmDialog}
            onOpenChange={() => {}}
            emailToConfirm={scanner.emailToConfirm}
            onConfirm={scanner.handleConfirm}
            onCancel={scanner.handleCancel}
         />

         <ShareScanDialog
            open={scanner.openShare}
            onOpenChange={scanner.setOpenShare}
            qrCodeDataUrl={scanner.qrCodeDataUrl}
            emailSending={scanner.emailSending}
            onSendUrl={scanner.sendUrlViaEmail}
            onSendImage={scanner.sendImageViaEmail}
            demoMode={demoMode}
         />

         <ScanMenuDialog
            open={scanner.openMenu}
            demoMode={demoMode}
            onOpenChange={scanner.setOpenMenu}
            scanning={scanner.scanning}
            scanStatus={scanner.scanStatus}
            scannedImageUrl={scanner.scannedImageUrl}
            onStartScan={scanner.startScan}
            onShare={scanner.generateAndOpenQRModal}
         />

         <DemoEmailModal open={scanner.demoMailOpen} onOpenChange={scanner.setDemoMailOpen} />

         <div className="min-h-screen p-4 pb-2">
            <div className="max-w-[1920px] mx-auto">
               <Header hostname={statsData?.hostname || ""} demoMode={demoMode} />
              
               <div className="grid grid-cols-12 gap-4 mt-2 h-[calc(100vh-80px)] min-h-0">
                  <div className="col-span-10 flex flex-col gap-4 h-full min-h-0">
                     <div className="grid grid-cols-2 gap-4 h-1/2 min-h-0">
                        <Card className="flex-1 h-full min-h-0 flex flex-col">
                              <CardHeader className="flex items-center justify-between">
                              <CardTitle>{translations.page.cards.cpu}</CardTitle>
                           </CardHeader>
                           <CardContent className="flex-1 min-h-0">
                              <CpuUsage data={statsData?.cpu} loadAverage={statsData?.loadAverage} loading={loading} />
                           </CardContent>
                        </Card>

                        <Card className="flex-1 h-full min-h-0 flex flex-col">
                           <CardHeader>
                              <CardTitle>{translations.page.cards.memory}</CardTitle>
                           </CardHeader>
                           <CardContent className="flex-1 min-h-0">
                              <MemoryUsage memory={statsData?.memory} swap={statsData?.swap} loading={loading} />
                           </CardContent>
                        </Card>
                     </div>
                     <div className="grid grid-cols-2 gap-4 h-1/2 min-h-0">
                        <Card className="flex-1 h-full min-h-0 flex flex-col">
                              <CardHeader>
                              <CardTitle>{translations.page.cards.storage}</CardTitle>
                           </CardHeader>
                           <CardContent className="flex-1 min-h-0">
                              <DiskUsage
                                 mainDisk={diskData || undefined}
                                 storageDisk={diskData4TB || undefined}
                                 loading={loading}
                              />
                           </CardContent>
                        </Card>

                        <Card className="flex-1 h-full min-h-0 flex flex-col">
                              <CardHeader>
                              <CardTitle>{translations.page.cards.sensors}</CardTitle>
                           </CardHeader>
                           <CardContent className="flex-1 min-h-0">
                              <SensorData sensors={statsData?.sensors} loading={loading} />
                           </CardContent>
                        </Card>
                     </div>
                  </div>
                  <div className="col-span-2 flex flex-col gap-4 h-full min-h-0">
                     <Card>
                        <CardContent>
                           <TimeDisplay lastUpdated={lastUpdated} />
                        </CardContent>
                     </Card>

                     <Card className="overflow-hidden">
                                <CardHeader className="flex items-center justify-between">
                              <div className="flex items-center justify-between w-full">
                                <CardTitle>{translations.page.cards.envSensors}</CardTitle>
                                <OnlineStatus isOnline={sensorTableData?.isOnline || false} />
                              </div>
                        </CardHeader>
                        <CardContent>
                           {/* keep existing SensorTable component which renders a table */}
                           <SensorTable data={sensorTableData} loading={loading} />
                        </CardContent>
                     </Card>

                     {/* Ultima card che riempie lo spazio rimanente */}
                     <Card className="flex-1 h-full min-h-0 flex flex-col">
                        <CardHeader>
                           <CardTitle>{translations.page.cards.commands}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto min-h-0">
                           <Commands />
                        </CardContent>
                     </Card>
                  </div>
               </div>
            </div>
         </div>
         <LogDialog open={openLogDialog} onOpenChange={setOpenLogDialog} demoMode={demoMode} />
         <ProcessDialog open={openProcessDialog} onOpenChange={setOpenProcessDialog} demoMode={demoMode} />
      </>
   );
}
