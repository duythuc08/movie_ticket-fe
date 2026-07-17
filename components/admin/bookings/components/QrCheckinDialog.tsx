"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  onScan: (qrCode: string) => Promise<void>;
}

type ScanState = "scanning" | "loading" | "success" | "error";

export function QrCheckinDialog({ open, onClose, onScan }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [errorMessage, setErrorMessage] = useState("");

  const stopScanner = async () => {
    const s = scannerRef.current;
    if (!s) return;
    try {
      if (s.isScanning) await s.stop();
      await s.clear();
    } catch {}
    scannerRef.current = null;
  };

  const startScanner = async (onDecoded: (text: string) => void) => {
    await stopScanner();
    const s = new Html5Qrcode("qr-checkin-reader");
    scannerRef.current = s;
    try {
      await s.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onDecoded,
        () => {}
      );
    } catch {
      setErrorMessage("Không thể truy cập camera");
      setScanState("error");
    }
  };

  const handleDecoded = async (decodedText: string) => {
    await stopScanner();
    setScanState("loading");
    try {
      await onScan(decodedText);
      setScanState("success");
    } catch (err: any) {
      setErrorMessage(err?.message || "Check-in thất bại");
      setScanState("error");
    }
  };

  useEffect(() => {
    if (!open) return;
    setScanState("scanning");
    setErrorMessage("");
    startScanner(handleDecoded);
    return () => { stopScanner(); };
  }, [open]);

  const handleClose = async () => {
    await stopScanner();
    setScanState("scanning");
    setErrorMessage("");
    onClose();
  };

  const handleRetry = async () => {
    setScanState("scanning");
    setErrorMessage("");
    await startScanner(handleDecoded);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        data-admin=""
        className="max-w-sm p-0 overflow-hidden bg-admin-surface border border-admin-border text-admin"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-admin-border">
          <h2 className="text-base font-bold text-admin">Quét QR Check-in</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md text-admin-3 hover:text-admin hover:bg-admin-surface-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4 min-h-[320px] justify-center">
          {/* Luôn render div này để html5-qrcode có DOM node để mount vào */}
          <div
            id="qr-checkin-reader"
            className="w-full rounded-xl overflow-hidden [&_video]:scale-x-[-1]"
            style={{ display: scanState === "scanning" ? "block" : "none" }}
          />

          {scanState === "scanning" && (
            <p className="text-xs text-admin-4 text-center">Hướng camera vào mã QR trên vé của khách</p>
          )}

          {scanState === "loading" && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-admin-accent animate-spin" />
              <p className="text-sm text-admin-2">Đang xử lý...</p>
            </div>
          )}

          {scanState === "success" && (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle className="w-16 h-16 text-emerald-400" />
              <p className="text-lg font-bold text-emerald-400">Check-in thành công!</p>
              <button
                onClick={handleClose}
                className="mt-2 px-6 py-2 rounded-lg bg-admin-surface-2 border border-admin-border text-admin text-sm font-medium hover:bg-admin-surface-3 transition-colors"
              >
                Đóng
              </button>
            </div>
          )}

          {scanState === "error" && (
            <div className="flex flex-col items-center gap-3">
              <XCircle className="w-16 h-16 text-rose-400" />
              <p className="text-lg font-bold text-rose-400">Check-in thất bại</p>
              <p className="text-sm text-admin-3 text-center">{errorMessage}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleRetry}
                  className="px-5 py-2 rounded-lg bg-admin-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Quét lại
                </button>
                <button
                  onClick={handleClose}
                  className="px-5 py-2 rounded-lg bg-admin-surface-2 border border-admin-border text-admin text-sm font-medium hover:bg-admin-surface-3 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
