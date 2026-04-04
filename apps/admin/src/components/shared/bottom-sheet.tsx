"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  isDirty?: boolean;
  snapPoints?: number[];
  initialSnap?: number;
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
};

export default function BottomSheet({
  open,
  onClose,
  isDirty = false,
  snapPoints = [1.0],
  initialSnap = 0,
  children,
  header,
  footer,
}: BottomSheetProps) {
  const [windowHeight, setWindowHeight] = useState(0);
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const [showDirtyConfirm, setShowDirtyConfirm] = useState(false);
  const y = useMotionValue(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Measure window on mount
  useEffect(() => {
    const update = () => setWindowHeight(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Reset snap when opening
  useEffect(() => {
    if (open && windowHeight > 0) {
      setCurrentSnap(initialSnap);
      const targetY = windowHeight * (1 - snapPoints[initialSnap]);
      y.set(windowHeight); // start off-screen
      animate(y, targetY, { type: "spring", damping: 35, stiffness: 300 });
    }
  }, [open, windowHeight]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) attemptClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, isDirty]);

  const attemptClose = useCallback(() => {
    if (isDirty) {
      setShowDirtyConfirm(true);
    } else {
      dismissSheet();
    }
  }, [isDirty]);

  const dismissSheet = useCallback(() => {
    if (windowHeight > 0) {
      animate(y, windowHeight, {
        type: "spring",
        damping: 35,
        stiffness: 300,
        onComplete: onClose,
      });
    } else {
      onClose();
    }
  }, [windowHeight, onClose, y]);

  const snapTo = useCallback(
    (index: number) => {
      if (windowHeight === 0) return;
      const clamped = Math.max(0, Math.min(index, snapPoints.length - 1));
      setCurrentSnap(clamped);
      const targetY = windowHeight * (1 - snapPoints[clamped]);
      animate(y, targetY, { type: "spring", damping: 35, stiffness: 300 });
    },
    [windowHeight, snapPoints, y]
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: { velocity: { y: number }; offset: { y: number } }) => {
      const currentY = y.get();
      const velocity = info.velocity.y;

      // Fast swipe down → dismiss
      if (velocity > 500) {
        attemptClose();
        return;
      }

      // Fast swipe up → go to max snap
      if (velocity < -500) {
        snapTo(snapPoints.length - 1);
        return;
      }

      // Find nearest snap point
      const snapYPositions = snapPoints.map((sp) => windowHeight * (1 - sp));
      let nearestIndex = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < snapYPositions.length; i++) {
        const dist = Math.abs(snapYPositions[i] - currentY);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIndex = i;
        }
      }

      // If dragged past dismiss threshold (below 30% visible)
      if (currentY > windowHeight * 0.7) {
        attemptClose();
        return;
      }

      snapTo(nearestIndex);
    },
    [windowHeight, snapPoints, y, snapTo, attemptClose]
  );

  // Expand to full on tap of drag handle (toggle between snap points)
  const handleHandleTap = useCallback(() => {
    if (currentSnap < snapPoints.length - 1) {
      snapTo(currentSnap + 1);
    } else {
      snapTo(0);
    }
  }, [currentSnap, snapPoints.length, snapTo]);

  if (!open || windowHeight === 0) return null;

  const isFullScreen = snapPoints[snapPoints.length - 1] >= 0.95;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={attemptClose}
          />

          {/* Sheet — fills the entire right pane (to the right of sidebar) */}
          <motion.div
            ref={sheetRef}
            className="fixed left-0 right-0 bottom-0 z-50 flex flex-col bg-surface shadow-2xl will-change-transform"
            style={{
              y,
              height: windowHeight,
              borderTopLeftRadius: isFullScreen ? 0 : 16,
              borderTopRightRadius: isFullScreen ? 0 : 16,
            }}
            drag={isFullScreen ? false : "y"}
            dragConstraints={{ top: 0 }}
            dragElastic={0.05}
            onDragEnd={handleDragEnd}
            dragMomentum={false}
          >
            {/* Drag handle — hidden when full-screen */}
            {!isFullScreen && (
              <div
                className="flex items-center justify-center py-2.5 cursor-grab active:cursor-grabbing shrink-0"
                onClick={handleHandleTap}
              >
                <div className="w-9 h-1 rounded-full bg-border-strong" />
              </div>
            )}

            {/* Header (sticky) */}
            {header && (
              <div className="shrink-0 border-b border-border">{header}</div>
            )}

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>

            {/* Footer (sticky) */}
            {footer && (
              <div className="shrink-0 border-t border-border">{footer}</div>
            )}
          </motion.div>

          {/* Unsaved changes confirmation */}
          {showDirtyConfirm && (
            <>
              <motion.div
                className="fixed inset-0 z-[60] bg-black/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowDirtyConfirm(false)}
              />
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div
                  className="w-full max-w-[320px] bg-surface rounded-[var(--radius-lg)] border border-border shadow-2xl p-5"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <p className="text-[14px] font-medium text-text-primary text-center mb-4">
                    {/* i18n handled by parent via props if needed */}
                    Unsaved changes will be lost.
                  </p>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setShowDirtyConfirm(false)}
                      className="flex-1 h-10 rounded-[var(--radius-md)] border border-border text-[13px] font-medium text-text-secondary hover:bg-surface-hover transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowDirtyConfirm(false);
                        dismissSheet();
                      }}
                      className="flex-1 h-10 rounded-[var(--radius-md)] bg-danger text-white text-[13px] font-medium hover:bg-danger/90 transition-colors"
                    >
                      Discard
                    </button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
