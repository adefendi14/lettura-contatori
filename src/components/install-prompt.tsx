"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getInstallPrompt,
  isInstalledPwa,
  isIosSafari,
  subscribeInstallPrompt,
  subscribeInstalled,
  triggerInstallPrompt,
} from "@/lib/install-prompt";

export function InstallPrompt() {
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // API browser: installazione e Safari iOS sono noti solo sul client
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lettura client-only
    setInstalled(isInstalledPwa());
    setIos(isIosSafari());
    setCanPrompt(Boolean(getInstallPrompt()));
    const unsubPrompt = subscribeInstallPrompt(() =>
      setCanPrompt(Boolean(getInstallPrompt()))
    );
    const unsubInstalled = subscribeInstalled(() =>
      setInstalled(isInstalledPwa())
    );
    return () => {
      unsubPrompt();
      unsubInstalled();
    };
  }, []);

  if (installed || dismissed) return null;
  if (!canPrompt && !ios) return null;

  const install = async () => {
    await triggerInstallPrompt();
  };

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-border bg-card p-4 shadow-lg sm:left-auto sm:right-6"
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          {ios ? (
            <Share className="h-5 w-5 text-foreground" aria-hidden />
          ) : (
            <Download className="h-5 w-5 text-foreground" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            Aggiungi alla schermata Home
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {ios
              ? "Tocca Condividi, poi «Aggiungi a Home»: l’app resta usabile anche senza rete."
              : "Installala sul telefono per usarla offline durante i sopralluoghi."}
          </p>
          <div className="mt-3 flex gap-2">
            {!ios && (
              <Button type="button" size="sm" onClick={install}>
                Installa
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
            >
              {ios ? "Ho capito" : "Più tardi"}
            </Button>
          </div>
        </div>
        <button
          type="button"
          className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          onClick={() => setDismissed(true)}
          aria-label="Chiudi"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
