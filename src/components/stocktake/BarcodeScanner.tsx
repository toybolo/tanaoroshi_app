"use client";

import { useEffect, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";

const SCANNER_REGION_ID = "barcode-scanner-region";

export function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (code: string) => void;
  onClose: () => void;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (!isMounted) return;

      const scanner = new Html5Qrcode(SCANNER_REGION_ID);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            onDetected(decodedText);
          },
          () => {
            // 1フレームごとのデコード失敗は無視する
          },
        )
        .then(() => {
          if (isMounted) {
            isRunningRef.current = true;
          } else {
            // マウント解除後に起動が完了した場合は即座に停止する
            scanner.stop().catch(() => {});
          }
        })
        .catch(() => {
          if (isMounted) {
            setErrorMessage(
              "カメラを起動できませんでした。ブラウザのカメラ権限を確認してください。",
            );
          }
        });
    });

    return () => {
      isMounted = false;
      const scanner = scannerRef.current;
      if (scanner && isRunningRef.current) {
        isRunningRef.current = false;
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm rounded bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            バーコードをスキャン
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            閉じる
          </button>
        </div>
        {errorMessage && (
          <p className="mb-2 text-sm text-red-600">{errorMessage}</p>
        )}
        <div id={SCANNER_REGION_ID} className="w-full" />
      </div>
    </div>
  );
}
