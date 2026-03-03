import { motion } from 'framer-motion';
import { X, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { ProductReport, Alternative } from '@/lib/types';
import ScoreRing from './ScoreRing';

interface Props {
  original: ProductReport;
  alternative: Alternative;
  onClose: () => void;
  onAnalyze: (name: string) => void;
}

const Arrow = ({ better, neutral }: { better: boolean; neutral?: boolean }) => {
  if (neutral) return <Minus className="h-3 w-3 text-muted-foreground" />;
  return better
    ? <ArrowUp className="h-3 w-3 text-safe" />
    : <ArrowDown className="h-3 w-3 text-harmful" />;
};

export default function ComparisonModal({ original, alternative, onClose, onAnalyze }: Props) {
  const rows = [
    {
      label: 'Overall Score',
      orig: original.overallScore,
      origDisplay: `${original.overallScore}/10`,
      alt: alternative.score,
      altDisplay: `${alternative.score}/10`,
      better: alternative.score > original.overallScore,
      hasData: true,
    },
    {
      label: 'Ingredient Purity',
      orig: original.ingredientPurityScore,
      origDisplay: `${original.ingredientPurityScore}/100`,
      alt: alternative.ingredientPurityScore,
      altDisplay: alternative.ingredientPurityScore ? `${alternative.ingredientPurityScore}/100` : null,
      better: (alternative.ingredientPurityScore || 0) > original.ingredientPurityScore,
      hasData: !!alternative.ingredientPurityScore,
    },
    {
      label: 'Value for Money',
      orig: original.valueForMoney,
      origDisplay: `${original.valueForMoney}/10`,
      alt: alternative.valueForMoney,
      altDisplay: alternative.valueForMoney ? `${alternative.valueForMoney}/10` : null,
      better: (alternative.valueForMoney || 0) > original.valueForMoney,
      hasData: !!alternative.valueForMoney,
    },
    {
      label: 'Verdict',
      orig: null,
      origDisplay: original.verdict,
      alt: null,
      altDisplay: alternative.verdict || null,
      better: false,
      hasData: !!alternative.verdict,
      isText: true,
    },
    {
      label: 'Regulatory',
      orig: null,
      origDisplay: original.regulatoryStatus,
      alt: null,
      altDisplay: alternative.regulatoryStatus || null,
      better: false,
      hasData: !!alternative.regulatoryStatus,
      isText: true,
    },
    {
      label: 'Review Auth.',
      orig: original.reviewAuthenticity,
      origDisplay: `${original.reviewAuthenticity}%`,
      alt: alternative.reviewAuthenticity,
      altDisplay: alternative.reviewAuthenticity ? `${alternative.reviewAuthenticity}%` : null,
      better: (alternative.reviewAuthenticity || 0) > original.reviewAuthenticity,
      hasData: !!alternative.reviewAuthenticity,
    },
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
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md glass rounded-2xl p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-foreground">Compare Products</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        {/* Score comparison visual */}
        <div className="flex items-center justify-around mb-5">
          <div className="text-center">
            <ScoreRing score={original.overallScore} maxScore={10} size={64} strokeWidth={4} />
            <p className="mt-1.5 text-[10px] text-muted-foreground font-medium truncate max-w-[100px]">{original.productName}</p>
          </div>
          <span className="text-lg font-bold text-muted-foreground">VS</span>
          <div className="text-center">
            <ScoreRing score={alternative.score} maxScore={10} size={64} strokeWidth={4} />
            <p className="mt-1.5 text-[10px] text-muted-foreground font-medium truncate max-w-[100px]">{alternative.name}</p>
          </div>
        </div>

        {/* Comparison rows */}
        <div className="space-y-1.5">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center rounded-lg bg-muted/30 px-3 py-2">
              <span className="text-[11px] text-muted-foreground flex-1">{row.label}</span>
              <span className="text-xs font-medium text-foreground w-20 text-center">{row.origDisplay}</span>
              <div className="w-8 flex justify-center">
                {row.hasData && !row.isText && <Arrow better={row.better} />}
                {row.hasData && row.isText && <Minus className="h-3 w-3 text-muted-foreground" />}
              </div>
              <span className={`text-xs font-medium w-20 text-center ${row.hasData ? (row.better ? 'text-safe' : 'text-foreground') : 'text-muted-foreground'}`}>
                {row.altDisplay || 'N/A'}
              </span>
            </div>
          ))}
        </div>

        {alternative.reason && (
          <p className="mt-3 text-[10px] text-muted-foreground italic text-center">"{alternative.reason}"</p>
        )}

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
