"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import ReceiptTemplate from "./receipt-template";
import { getReceiptData, type ReceiptData } from "@/lib/receipt-queries";

type Props = {
  /** Provide receipt data directly (from checkout flow) */
  receiptData?: ReceiptData | null;
  /** Or provide order number to fetch data (from history) */
  orderNumber?: string;
  /** Trigger element — wraps the child button */
  children: (props: { onPrint: () => void; isPrinting: boolean }) => React.ReactNode;
};

export default function PrintReceipt({
  receiptData,
  orderNumber,
  children,
}: Props) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [data, setData] = useState<ReceiptData | null>(receiptData || null);
  const [mounted, setMounted] = useState(false);
  const shouldPrintRef = useRef(false);

  useEffect(() => setMounted(true), []);

  // Sync external receiptData prop
  useEffect(() => {
    if (receiptData) setData(receiptData);
  }, [receiptData]);

  // When data updates and we're waiting to print, trigger window.print()
  useEffect(() => {
    if (shouldPrintRef.current && data) {
      shouldPrintRef.current = false;
      // Double rAF to ensure paint before print
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.print();
          setTimeout(() => setIsPrinting(false), 500);
        });
      });
    }
  }, [data]);

  const handlePrint = useCallback(async () => {
    setIsPrinting(true);

    try {
      if (data) {
        // Data already available — print after next paint
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.print();
            setTimeout(() => setIsPrinting(false), 500);
          });
        });
        return;
      }

      // Fetch data, then let useEffect trigger print after render
      if (orderNumber) {
        const printData = await getReceiptData(orderNumber);
        if (printData) {
          shouldPrintRef.current = true;
          setData(printData);
        } else {
          console.error("No receipt data found for", orderNumber);
          setIsPrinting(false);
        }
      } else {
        console.error("No receipt data or order number provided");
        setIsPrinting(false);
      }
    } catch (err) {
      console.error("Print failed:", err);
      setIsPrinting(false);
    }
  }, [data, orderNumber]);

  // Portal the receipt div directly into document.body so it's a direct child,
  // outside any fixed/overflow containers like modals
  const receiptPortal =
    mounted && data
      ? createPortal(
          <div className="receipt-print-area">
            <ReceiptTemplate data={data} />
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {children({ onPrint: handlePrint, isPrinting })}
      {receiptPortal}
    </>
  );
}
