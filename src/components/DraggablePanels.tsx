import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { UtensilsCrossed, ChevronUp } from 'lucide-react';

interface DraggablePanelsProps {
  topPanel: ReactNode;
  bottomPanel: ReactNode;
}

const COLLAPSED_HEIGHT = 56;
const SNAP_THRESHOLD = 0.4;

export default function DraggablePanels({ topPanel, bottomPanel }: DraggablePanelsProps) {
  const [expanded, setExpanded] = useState(false);

  // 0 = collapsed strip, 1 = fully expanded sheet
  const progress = useMotionValue(0);

  // Sheet height grows from 56px → 85vh
  const sheetHeight = useTransform(progress, [0, 1], [`${COLLAPSED_HEIGHT}px`, '85vh']);
  const contentOpacity = useTransform(progress, [0, 0.4, 1], [0, 0.3, 1]);
  const handleRotation = useTransform(progress, [0, 1], [0, 180]);
  const backdropOpacity = useTransform(progress, [0, 1], [0, 0.4]);
  const backdropPointerEvents = useTransform(progress, (v) => (v > 0.05 ? 'auto' : 'none'));

  const snapTo = useCallback((target: number) => {
    animate(progress, target, { type: 'spring', stiffness: 400, damping: 35 });
    setExpanded(target === 1);
  }, [progress]);

  const handleDrag = (_: any, info: PanInfo) => {
    const range = window.innerHeight * 0.85 - COLLAPSED_HEIGHT;
    const startProgress = expanded ? 1 : 0;
    const delta = -info.offset.y / range;
    progress.set(Math.max(0, Math.min(1, startProgress + delta)));
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const current = progress.get();
    const velocity = info.velocity.y;
    if (Math.abs(velocity) > 500) {
      snapTo(velocity < 0 ? 1 : 0);
      return;
    }
    if (!expanded && current > SNAP_THRESHOLD) snapTo(1);
    else if (expanded && current < 1 - SNAP_THRESHOLD) snapTo(0);
    else snapTo(expanded ? 1 : 0);
  };

  const togglePanel = () => snapTo(expanded ? 0 : 1);

  return (
    <>
      {/* Section 1 — Product Search: full natural page flow with bottom padding so strip doesn't cover it */}
      <div className="pb-20">{topPanel}</div>

      {/* Backdrop when expanded */}
      <motion.div
        className="fixed inset-0 bg-foreground z-30"
        style={{ opacity: backdropOpacity, pointerEvents: backdropPointerEvents as any }}
        onClick={() => snapTo(0)}
      />

      {/* Bottom sheet — absolutely pinned to viewport bottom */}
      <motion.div
        className="fixed left-0 right-0 bottom-0 bg-card rounded-t-3xl border-t border-border shadow-[0_-4px_24px_-8px_hsl(var(--foreground)/0.15)] z-40 flex flex-col"
        style={{ height: sheetHeight }}
      >
        {/* Drag Handle */}
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          className="cursor-grab active:cursor-grabbing touch-none select-none shrink-0"
        >
          <button
            onClick={togglePanel}
            className="w-full flex flex-col items-center gap-1 py-2.5 px-4"
          >
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            <div className="flex items-center gap-2 mt-0.5">
              <UtensilsCrossed className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Restaurant Menu Scanner</span>
              <motion.div style={{ rotate: handleRotation }}>
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </div>
          </button>
        </motion.div>

        {/* Sheet content */}
        <motion.div
          className="flex-1 overflow-y-auto px-4 pb-6"
          style={{ opacity: contentOpacity }}
        >
          {bottomPanel}
        </motion.div>
      </motion.div>
    </>
  );
}
