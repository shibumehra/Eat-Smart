import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { UtensilsCrossed, ChevronUp, ChevronDown } from 'lucide-react';

interface DraggablePanelsProps {
  topPanel: ReactNode;
  bottomPanel: ReactNode;
}

const COLLAPSED_HEIGHT = 56; // px for the bottom strip
const SNAP_THRESHOLD = 0.4;

export default function DraggablePanels({ topPanel, bottomPanel }: DraggablePanelsProps) {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // progress: 0 = collapsed (top panel visible), 1 = expanded (bottom panel visible)
  const progress = useMotionValue(0);

  // Top panel: from 100% - strip height → header bar (~56px)
  const topPanelHeight = useTransform(progress, [0, 1], ['calc(100vh - 120px - 64px)', '56px']);
  const topPanelOpacity = useTransform(progress, [0, 0.5, 1], [1, 0.6, 0]);
  const topPanelScale = useTransform(progress, [0, 1], [1, 0.95]);
  const topPanelOverflow = useTransform(progress, (v) => v > 0.3 ? 'hidden' : 'auto');

  // Bottom panel: from strip → full area
  const bottomPanelFlex = useTransform(progress, [0, 1], [0, 1]);
  const bottomPanelOpacity = useTransform(progress, [0, 0.3, 1], [0.7, 0.9, 1]);

  // Handle indicator rotation
  const handleRotation = useTransform(progress, [0, 1], [0, 180]);

  const snapTo = useCallback((target: number) => {
    animate(progress, target, {
      type: 'spring',
      stiffness: 400,
      damping: 35,
    });
    setExpanded(target === 1);
  }, [progress]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const current = progress.get();
    const velocity = info.velocity.y;

    // Use velocity for quick swipes
    if (Math.abs(velocity) > 500) {
      snapTo(velocity < 0 ? 1 : 0);
      return;
    }

    // Snap based on threshold
    if (!expanded && current > SNAP_THRESHOLD) {
      snapTo(1);
    } else if (expanded && current < 1 - SNAP_THRESHOLD) {
      snapTo(0);
    } else {
      snapTo(expanded ? 1 : 0);
    }
  };

  const handleDrag = (_: any, info: PanInfo) => {
    const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
    const dragDistance = -info.offset.y;
    const dragProgress = Math.max(0, Math.min(1, dragDistance / (containerHeight * 0.6)));

    if (expanded) {
      // When expanded, dragging down collapses
      const reverseDistance = info.offset.y;
      const reverseProgress = Math.max(0, Math.min(1, 1 - reverseDistance / (containerHeight * 0.6)));
      progress.set(reverseProgress);
    } else {
      progress.set(dragProgress);
    }
  };

  const togglePanel = () => snapTo(expanded ? 0 : 1);

  return (
    <div ref={containerRef} className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      {/* Top Panel — Product Search */}
      <motion.div
        style={{
          height: topPanelHeight,
          opacity: topPanelOpacity,
          scale: topPanelScale,
          overflow: topPanelOverflow,
        }}
        className="relative rounded-b-2xl"
      >
        <div className="h-full overflow-y-auto pb-2">
          {topPanel}
        </div>
      </motion.div>

      {/* Drag Handle + Bottom Panel — Restaurant Menu */}
      <motion.div
        className="flex-1 flex flex-col min-h-[64px] bg-card rounded-t-3xl border-t border-border shadow-[0_-4px_24px_-8px_hsl(var(--foreground)/0.08)] relative z-10"
        style={{ opacity: bottomPanelOpacity }}
      >
        {/* Drag Handle */}
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          className="cursor-grab active:cursor-grabbing touch-none select-none"
        >
          <button
            onClick={togglePanel}
            className="w-full flex flex-col items-center gap-1 py-3 px-4"
          >
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            <div className="flex items-center gap-2 mt-1">
              <UtensilsCrossed className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Restaurant Menu Scanner</span>
              <motion.div style={{ rotate: handleRotation }}>
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </div>
          </button>
        </motion.div>

        {/* Bottom Content */}
        <motion.div
          className="flex-1 overflow-y-auto px-4 pb-4"
          style={{
            opacity: useTransform(progress, [0, 0.5, 1], [0, 0.5, 1]),
          }}
        >
          {bottomPanel}
        </motion.div>
      </motion.div>
    </div>
  );
}
