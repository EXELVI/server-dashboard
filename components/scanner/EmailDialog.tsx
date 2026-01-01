"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { getTranslations } from "@/lib/translations";

const translations = getTranslations(process.env.NEXT_PUBLIC_LOCALE || undefined);

export function EmailDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  emailSending: boolean;
  onSend: (email: string) => void;
}) {
  const { open, onOpenChange, emailSending, onSend } = props;
  const [email, setEmail] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{translations.emailDialog.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-muted-foreground">{translations.emailDialog.description}</p>

          <Input
            type="email"
            placeholder={translations.emailDialog.placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && email) {
                e.preventDefault();
                onSend(email);
              } else if (e.key === "Escape") {
                e.preventDefault();
                onOpenChange(false);
              }
            }}
            disabled={emailSending}
            autoFocus
          />

          <div className="flex gap-2">
            <Button onClick={() => onOpenChange(false)} variant="outline" className="flex-1" disabled={emailSending}>
              <Kbd>Esc</Kbd> {translations.emailDialog.cancel}
            </Button>
            <Button onClick={() => onSend(email)} className="flex-1" disabled={!email || emailSending}>
              <Kbd>Enter</Kbd> {emailSending ? translations.emailDialog.sending : translations.emailDialog.send}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
