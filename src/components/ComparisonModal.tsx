import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ProductReport, Alternative } from '@/lib/types';

interface Props {
  original: ProductReport;
  alternative: Alternative;
  onClose: () => void;
  onAnalyze: (name: string) => void;
}

const Arrow = ({ better }: { better: boolean }) => (
  <span className={`text-xs font-bold ${better ? 'text-safe' : 'text-harmful'}`}>
    {better ? '↑' : '↓'}
  </span>
);

export default function ComparisonModal({ original, alternative, onClose, onAnalyze }: Props) {
  const rows = [
    { label: 'Overall Score', orig: `${original.overallScore}/10`, alt: `${alternative.score}/10`, better: alternative.score > original.overallScore },
    { label: 'Ingredient Purity', orig: `${original.ingredientPurityScore}/100`, alt: '—', better: false },
    { label: 'Verdict', orig: original.verdict, alt: '—', better: false },
    { label: 'Value for Money', orig: `${original.valueForMoney}/10`, alt: '—', better: false },
    { label: 'Regulatory', orig: original.regulatoryStatus, alt: '—', better: false },
    { label: 'Review Auth.', orig: `${original.reviewAuthenticity}%`, alt: '—', better: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="w-full max-w-md glass rounded-2xl p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-foreground">Compare Products</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-3 bg-muted/50 p-2.5 text-[10px] font-semibold text-muted-foreground">
            <span>Metric</span>
            <span className="text-center truncate">{original.productName.slice(0, 15)}</span>
            <span className="text-center truncate">{alternative.name.slice(0, 15)}</span>
          </div>
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-3 border-t border-border p-2.5 text-xs">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="text-center text-foreground">{row.orig}</span>
              <span className="text-center text-foreground flex items-center justify-center gap-1">
                {row.alt} {row.alt !== '—' && <Arrow better={row.better} />}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => { onClose(); onAnalyze(alternative.name); }}
          className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
        >
          Full Analysis of {alternative.name}
        </button>
      </motion.div>
    </motion.div>
  );
}
