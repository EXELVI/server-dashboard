"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert, Wifi } from "lucide-react";
import { getTranslations } from "@/lib/translations";

const translations = getTranslations(process.env.NEXT_PUBLIC_LOCALE || undefined);

export function ShareScanDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  qrCodeDataUrl: string | null;
  demoMode?: boolean;
  emailSending: boolean;
  onSendUrl: () => void;
  onSendImage: () => void;
}) {
  const { open, onOpenChange, qrCodeDataUrl, emailSending, onSendUrl, onSendImage, demoMode } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{translations.shareScan.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg shadow-lg border border-slate-200">
            {qrCodeDataUrl && <img src={qrCodeDataUrl} alt={translations.shareScan.qrAlt} className="w-64 h-64 rounded" />}
          </div>

          {demoMode && (
            <Alert variant="destructive">
              <TriangleAlert />
              <AlertTitle>{translations.shareScan.demoTitle}</AlertTitle>
              <AlertDescription>{translations.shareScan.demoDescription}</AlertDescription>
            </Alert>
          )}

          <Alert variant="default">
            <TriangleAlert />
            <AlertTitle>{translations.shareScan.noteTitle}</AlertTitle>
            <AlertDescription>
              {translations.shareScan.noteDescription}{" "}
              <span className="flex items-center font-bold">
                <Wifi className="mr-1 w-4 h-4" /> {process.env.NEXT_PUBLIC_WIFI_SSID}
              </span>{" "}
              {translations.shareScan.noteDescriptionSuffix}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-3 w-full">
            <Button
              onClick={onSendUrl}
              disabled={emailSending}
              className="col-span-2 w-full bg-purple-600 hover:bg-purple-700"
            >
              <Kbd>E</Kbd> {emailSending ? translations.shareScan.sending : translations.shareScan.emailUrl}
            </Button>

            <Button
              onClick={onSendImage}
              disabled={emailSending}
              className="col-span-2 w-full bg-indigo-600 hover:bg-indigo-700"
            >
              <Kbd>R</Kbd> {emailSending ? translations.shareScan.sending : translations.shareScan.emailImage}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            {translations.shareScan.closeHint} <Kbd>{translations.shareScan.closeHintKey}</Kbd>{" "}
            {translations.shareScan.closeHintSuffix}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
