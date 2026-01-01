"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { getTranslations, getFormattedTranslation } from "@/lib/translations";

const translations = getTranslations(process.env.NEXT_PUBLIC_LOCALE || undefined);

type EmailAction = "url" | "image" | null;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const generateDemoCanvasImage = () => {
   const width = 1080;
   const height = 1528;
   const canvas = document.createElement("canvas");
   canvas.width = width;
   canvas.height = height;

   const ctx = canvas.getContext("2d");
   if (!ctx) throw new Error("Canvas context not available");

   const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
   bgGradient.addColorStop(0, "#f9fafb");
   bgGradient.addColorStop(1, "#e5e7eb");
   ctx.fillStyle = bgGradient;
   ctx.fillRect(0, 0, width, height);

   ctx.fillStyle = "#ffffff";
   ctx.strokeStyle = "#111827";
   ctx.lineWidth = 4;
   ctx.setLineDash([12, 8]);
   ctx.fillRect(120, 140, width - 240, height - 280);
   ctx.strokeRect(120, 140, width - 240, height - 280);
   ctx.setLineDash([]);

   ctx.fillStyle = "#111827";
   ctx.font = "bold 46px 'Arial', monospace";
   ctx.textAlign = "center";
   ctx.fillText(translations.scanner.demoCanvas.title, width / 2, 230);

   ctx.fillStyle = "#6b7280";
   ctx.font = "26px 'Arial', monospace";
   ctx.fillText(translations.scanner.demoCanvas.subtitle, width / 2, 280);

   ctx.textAlign = "left";
   ctx.fillStyle = "#1f2937";
   ctx.font = "22px 'Arial', monospace";
   const now = new Date();
   const lines = [
      translations.scanner.demoCanvas.status,
      translations.scanner.demoCanvas.file,
      translations.scanner.demoCanvas.mode,
      getFormattedTranslation(translations.scanner.demoCanvas.generated, { date: now.toLocaleString() })
   ];
   lines.forEach((line, idx) => ctx.fillText(line, 180, 380 + idx * 44));

   ctx.fillStyle = "#374151";
   ctx.font = "20px 'Arial', monospace";
   const info = [
      translations.scanner.demoCanvas.infoLine1,
      translations.scanner.demoCanvas.infoLine2
   ];
   info.forEach((line, idx) => ctx.fillText(line, 180, 640 + idx * 34));

   const previewGradient = ctx.createLinearGradient(0, 0, width, 0);
   previewGradient.addColorStop(0, "#e5e7eb");
   previewGradient.addColorStop(1, "#d1d5db");
   ctx.fillStyle = previewGradient;
   ctx.strokeStyle = "#9ca3af";
   ctx.lineWidth = 3;
   const previewX = 180;
   const previewY = 840;
   const previewWidth = width - previewX * 2;
   const previewHeight = 360;
   ctx.fillRect(previewX, previewY, previewWidth, previewHeight);
   ctx.strokeRect(previewX, previewY, previewWidth, previewHeight);

   ctx.fillStyle = "#6b7280";
   ctx.font = "bold 36px 'SFMono-Regular', monospace";
   ctx.textAlign = "center";
   ctx.fillText(translations.scanner.demoCanvas.preview, width / 2, previewY + previewHeight / 2);

   return canvas.toDataURL("image/png");
};

export function useScanner(opts?: { mockScan?: boolean; qrBaseUrl?: string }) {
   const mockScan = opts?.mockScan ?? false;
   const qrBaseUrl =
      opts?.qrBaseUrl ??
      "http://" + (process.env.HOSTNAME || "localhost") + (process.env.PORT ? `:${process.env.PORT}` : ":3000");

   //modals + status
   const [openMenu, setOpenMenu] = useState(false);
   const [scanning, setScanning] = useState(false);
   const [scanStatus, setScanStatus] = useState("");
   const [scannedImageUrl, setScannedImageUrl] = useState<string | null>(null);

   // share (QR)
   const [openShare, setOpenShare] = useState(false);
   const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

   // MARK: - Email
   const [openEmail, setOpenEmail] = useState(false);
   const [emailAction, setEmailAction] = useState<EmailAction>(null);
   const [emailSending, setEmailSending] = useState(false);

   //Demo mail modal
   const [demoMailOpen, setDemoMailOpen] = useState(false);

   const allowedEmails = (process.env.NEXT_PUBLIC_ALLOWED_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

   const [showEmailConfirmDialog, setShowEmailConfirmDialog] = useState(false);
   const [emailToConfirm, setEmailToConfirm] = useState<string | null>(null);
   const onConfirmRef = useRef<null | (() => void)>(null);

   const confirmUnrecognizedEmail = useCallback(
      (email: string, onConfirm: () => void) => {
         if (allowedEmails.length === 0 || allowedEmails.includes(email)) return onConfirm();
         setEmailToConfirm(email);
         onConfirmRef.current = onConfirm;
         setShowEmailConfirmDialog(true);
      },
      [allowedEmails]
   );

   const handleConfirm = useCallback(() => {
      onConfirmRef.current?.();
      setShowEmailConfirmDialog(false);
      setEmailToConfirm(null);
      onConfirmRef.current = null;
   }, []);
   const handleCancel = useCallback(() => {
      onConfirmRef.current = null;
      setShowEmailConfirmDialog(false);
      setEmailToConfirm(null);
   }, []);

   // MARK: - Socket Scan
   const runDemoScan = useCallback(async () => {
      setScanning(true);
      setScannedImageUrl(null);
      setScanStatus(translations.scanner.demoConnecting);

      await delay(350);
      setScanStatus(translations.scanner.demoConnected);
      await delay(650);
      setScanStatus(translations.scanner.demoCapturing);
      await delay(900);
      setScanStatus(translations.scanner.demoProcessing);

      try {
         const dataUrl = generateDemoCanvasImage();
         setScannedImageUrl(dataUrl);
         setScanStatus(translations.scanner.demoCompleted);
      } catch (error) {
         console.error("Error generating demo image:", error);
         setScanStatus(translations.scanner.demoError);
      } finally {
         setScanning(false);
      }
   }, []);

   const startScan = useCallback(async () => {
      if (mockScan) {
         await runDemoScan();
         return;
      }

      setScanning(true);
      setScannedImageUrl(null);
      setScanStatus(translations.scanner.connecting);

      try {
         const res = await fetch("/api/scanSocket");
         if (!res.ok) throw new Error("scanSocket init failed");
      } catch (err) {
         console.warn("init socket api failed", err);
         setScanStatus(translations.scanner.connectionError);
         setScanning(false);
         return;
      }
      
      const { io } = await import("socket.io-client");
      const socket = io();

      socket.on("connect", () => {
         setScanStatus(translations.scanner.socketConnected);
         socket.send(process.env.NODE_ENV === "development" && mockScan ? "mockScan" : "startScan");
      });

      socket.on("message", (msg: any) => {
         setScanStatus(String(msg));
      });

      socket.on("scanStatus", (msg: any) => {
         try {
            const data = typeof msg === "string" ? JSON.parse(msg) : msg;

            if (data.status === "completed") {
               setScanStatus(
                  getFormattedTranslation(translations.scanner.scanCompleted, { fileName: data.fileName || "" })
               );
               setScannedImageUrl(data.routePath);
               setScanning(false);
               socket.close();
            } else if (data.status === "error") {
               setScanStatus(getFormattedTranslation(translations.scanner.scanError, { error: data.error || "" }));
               setScanning(false);
               socket.close();
            }
         } catch {
            setScanStatus(translations.scanner.invalidResponse);
            setScanning(false);
            socket.close();
         }
      });

      socket.on("error", () => {
         setScanStatus(translations.scanner.socketError);
         setScanning(false);
      });
   }, [mockScan, runDemoScan]);

   // MARK: - QR Code
   const generateAndOpenQRModal = useCallback(async () => {
      if (!scannedImageUrl) {
         toast.error(translations.scanner.noFile);
         return;
      }

      const isDataUrl = scannedImageUrl.startsWith("data:");
      const scanFileName = isDataUrl ? "demo-scan" : scannedImageUrl.split("/").pop() || "scan";
      const qrUrl = isDataUrl ? scannedImageUrl : `${qrBaseUrl}/scans/${scanFileName}`;

      try {
         const dataUrl = await QRCode.toDataURL(qrUrl, {
            errorCorrectionLevel: "H",
            type: "image/png",
            quality: 0.95,
            margin: 1,
            width: 300
         });
         setQrCodeDataUrl(dataUrl);
         setOpenShare(true);
      } catch (err) {
         console.error("Errore nella generazione del QR code:", err);
         toast.error(translations.scanner.qrGenerationError);
      }
   }, [scannedImageUrl, qrBaseUrl]);

   // MARK: - Email Actions
   const sendUrlViaEmail = useCallback(() => {
      setEmailAction("url");
      setOpenEmail(true);
   }, []);

   const sendImageViaEmail = useCallback(() => {
      setEmailAction("image");
      setOpenEmail(true);
   }, []);

   const sendWithEmail = useCallback(
      (email: string) => {
         if (!emailAction || !scannedImageUrl) return;

         if (mockScan) {
            toast.info(translations.scanner.demoEmailDisabled);
            setOpenEmail(false);
            return;
         }

         confirmUnrecognizedEmail(email, async () => {
            setEmailSending(true);
            try {
               const response = await fetch("/api/sendMail", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                     email,
                     action: emailAction,
                     scannedImageUrl
                  })
               });

               if (!response.ok) {
                  const error = await response.json().catch(() => ({}));
                  toast.error(error.error || translations.scanner.emailError);
                  return;
               }

               toast.success(
                  emailAction === "url"
                     ? translations.scanner.emailUrlSuccess
                     : translations.scanner.emailImageSuccess
               );
               setOpenEmail(false);
            } catch (error) {
               console.error("Errore invio:", error);
               toast.error(translations.scanner.connectionErrorEmail);
            } finally {
               setEmailSending(false);
            }
         });
      },
      [confirmUnrecognizedEmail, emailAction, scannedImageUrl, mockScan]
   );

   // MARK: - Shortcuts
   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         const isTypingInInput =
            document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement;

         if (openEmail && isTypingInInput) return;

         if (e.key.toLowerCase() === "l") {
            if (!openShare) {
               e.preventDefault();
               setOpenMenu((v) => !v);
            }
         }

         if (e.key.toLowerCase() === "k" && openMenu && !scanning) {
            e.preventDefault();
            startScan();
         }

         if (e.key.toLowerCase() === "d" && openMenu && !scanning) {
            e.preventDefault();
            if (mockScan) { 
               setDemoMailOpen(true);
            } else {
               if (scannedImageUrl && !openShare) generateAndOpenQRModal();
               else if (openShare) setOpenShare(false);
            }
         }

         if (e.key.toLowerCase() === "e" && openShare && !emailSending) {
            e.preventDefault();
            sendUrlViaEmail();
         }

         if (e.key.toLowerCase() === "r" && openShare && !emailSending) {
            e.preventDefault();
            sendImageViaEmail();
         }

         if (e.key.toLowerCase() === "f" && scannedImageUrl && !openShare) {
            const img = document.querySelector(`img[src='${scannedImageUrl}']`) as HTMLImageElement | null;
            if (document.fullscreenElement) document.exitFullscreen();
            else img?.requestFullscreen?.();
         }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
   }, [
      openMenu,
      openShare,
      openEmail,
      scanning,
      scannedImageUrl,
      emailSending,
      startScan,
      generateAndOpenQRModal,
      sendUrlViaEmail,
      sendImageViaEmail
   ]);

   // MARK: - Return
   return {
      // state
      openMenu,
      setOpenMenu,
      scanning,
      scanStatus,
      scannedImageUrl,

      openShare,
      setOpenShare,
      qrCodeDataUrl,

      openEmail,
      setOpenEmail,
      emailSending,
      emailAction,
      setEmailAction,
      demoMailOpen,
      setDemoMailOpen,

      showEmailConfirmDialog,
      emailToConfirm,

      // actions
      startScan,
      generateAndOpenQRModal,
      sendUrlViaEmail,
      sendImageViaEmail,
      sendWithEmail,
      handleConfirm,
      handleCancel
   };
}
