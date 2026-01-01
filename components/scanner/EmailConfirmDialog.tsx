"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { getTranslations, getFormattedTranslation } from "@/lib/translations";

const translations = getTranslations(process.env.NEXT_PUBLIC_LOCALE || undefined);

export function EmailConfirmDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  emailToConfirm: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { open, onOpenChange, emailToConfirm, onConfirm, onCancel } = props;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          } else if (e.key === "Enter") {
            e.preventDefault();
            onConfirm();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{translations.emailConfirm.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            {getFormattedTranslation(translations.emailConfirm.description, { email: emailToConfirm || "" })}
          </p>

          <div className="flex gap-2">
            <Button onClick={onCancel} variant="outline" className="flex-1">
              <Kbd>Esc</Kbd> {translations.emailConfirm.cancel}
            </Button>
            <Button onClick={onConfirm} className="flex-1">
              <Kbd>Enter</Kbd> {translations.emailConfirm.confirm}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
