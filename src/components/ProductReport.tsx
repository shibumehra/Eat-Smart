import { useState } from 'react';
import { motion } from 'framer-motion';
import { ProductReport as ReportType, Alternative } from '@/lib/types';
import ScoreRing from './ScoreRing';
import ComparisonModal from './ComparisonModal';
import { ChevronDown, ChevronUp, Shield, Star, ThumbsUp, ThumbsDown, Minus, Info } from 'lucide-react';

const verdictColors = { Buy: 'bg-safe/20 text-safe', Avoid: 'bg-harmful/20 text-harmful', 'Try Once': 'bg-caution/20 text-caution' };
const ingredientColors = { safe: 'bg-safe/15 text-safe border-safe/20', caution: 'bg-caution/15 text-caution border-caution/20', harmful: 'bg-harmful/15 text-harmful border-harmful/20', unknown: 'bg-muted text-muted-foreground border-border' };
const sentimentIcons = { positive: <ThumbsUp className="h-3 w-3" />, negative: <ThumbsDown className="h-3 w-3" />, neutral: <Minus className="h-3 w-3" /> };
const sentimentColors = { positive: 'border-safe/30 bg-safe/5', negative: 'border-harmful/30 bg-harmful/5', neutral: 'border-caution/30 bg-caution/5' };
const platformIcons: Record<string, string> = { YouTube: '📺', Reddit: '🟠', Amazon: '📦', Twitter: '🐦', Blog: '📝', Other: '🌐' };

interface Props {
  report: ReportType;
  onAnalyze: (name: string) => void;
}

export default function ProductReportView({ report, onAnalyze }: Props) {
  const [expandedIngredient, setExpandedIngredient] = useState<string | null>(null);
  const [showHealth, setShowHealth] = useState(false);
  const [compareAlt, setCompareAlt] = useState<Alternative | null>(null);
  const [showRegTooltip, setShowRegTooltip] = useState(false);

  const regIcon = report.regulatoryStatus === 'Certified' ? '✅' : report.regulatoryStatus === 'Not Certified' ? '❌' : '⚠️';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-8">
      {/* Header */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-start gap-4">
          <ScoreRing score={report.overallScore} maxScore={10} size={80} strokeWidth={5} />
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-lg font-bold text-foreground truncate">{report.productName}</h2>
            <p className="text-xs text-muted-foreground">{report.brand} · {report.category}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${verdictColors[report.verdict]}`}>
                {report.verdict}
              </span>
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                {report.foodType === 'veg' ? '🟢 Veg' : report.foodType === 'non-veg' ? '🔴 Non-Veg' : '⚪ Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="glass rounded-xl p-3 text-center">
          <ScoreRing score={report.ingredientPurityScore} maxScore={100} size={56} strokeWidth={4} />
          <p className="mt-1 text-[10px] text-muted-foreground">Ingredient Purity</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <ScoreRing score={report.reviewAuthenticity} maxScore={100} size={56} strokeWidth={4} />
          <p className="mt-1 text-[10px] text-muted-foreground">Review Auth.</p>
        </div>
        <div className="glass rounded-xl p-3 relative">
          <div className="flex flex-col items-center">
            <span className="text-2xl">{regIcon}</span>
            <p className="mt-1 text-xs font-medium text-foreground">{report.regulatoryStatus}</p>
            <p className="text-[10px] text-muted-foreground">Regulatory</p>
          </div>
          <button onClick={() => setShowRegTooltip(!showRegTooltip)} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
            <Info className="h-3 w-3" />
          </button>
          {showRegTooltip && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 glass rounded-lg p-2 text-[10px] text-muted-foreground shadow-lg">
              <p className="font-medium text-foreground mb-1">Reasoning:</p>
              <p>{report.regulatoryReasoning}</p>
              {Object.keys(report.crossRegionCertifications).length > 0 && (
                <>
                  <p className="font-medium text-foreground mt-1.5 mb-0.5">Cross-region:</p>
                  {Object.entries(report.crossRegionCertifications).map(([k, v]) => (
                    <p key={k}>{k}: {v}</p>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <ScoreRing score={report.valueForMoney} maxScore={10} size={56} strokeWidth={4} />
          <p className="mt-1 text-[10px] text-muted-foreground">Value for Money</p>
        </div>
      </div>

      {/* Content - Desktop 2 col */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-4 space-y-3 lg:space-y-0">
        <div className="lg:col-span-2 space-y-3">
          {/* About */}
          <Section title="📋 About This Product">
            <p className="text-sm text-muted-foreground leading-relaxed">{report.about}</p>
          </Section>

          {/* Verdict - mobile inline */}
          <div className="lg:hidden">
            <VerdictCard verdict={report.foodScoutVerdict} />
          </div>

          {/* Pros & Cons */}
          <Section title="✅ Top Pros & Cons">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1.5">
                {report.pros.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-safe mt-0.5 shrink-0">✓</span>
                    <span className="text-foreground/80">{p}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                {report.cons.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-harmful mt-0.5 shrink-0">✗</span>
                    <span className="text-foreground/80">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* Consensus */}
          <Section title="💬 General Consensus">
            <p className="text-sm text-muted-foreground leading-relaxed">{report.generalConsensus}</p>
          </Section>

          {/* Ingredients */}
          <Section title="🧪 Ingredient Analysis">
            <div className="flex flex-wrap gap-1.5">
              {report.ingredients.map((ing) => (
                <button
                  key={ing.name}
                  onClick={() => setExpandedIngredient(expandedIngredient === ing.name ? null : ing.name)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${ingredientColors[ing.status]}`}
                >
                  {ing.name}
                </button>
              ))}
            </div>
            {expandedIngredient && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="overflow-hidden">
                <div className="mt-2 glass rounded-lg p-3 text-xs text-muted-foreground">
                  {report.ingredients.find(i => i.name === expandedIngredient)?.detail}
                </div>
              </motion.div>
            )}
          </Section>

          {/* Alternatives */}
          <Section title="💡 Healthier Alternatives">
            <div className="space-y-2">
              {report.healthierAlternatives.map((alt) => (
                <div key={alt.name} className="glass rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{alt.name}</p>
                    <p className="text-[10px] text-muted-foreground">{alt.brand}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ScoreRing score={alt.score} maxScore={10} size={40} strokeWidth={3} />
                    <button
                      onClick={() => setCompareAlt(alt)}
                      className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors"
                    >
                      Compare
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Health Verdict */}
          <div className="glass rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowHealth(!showHealth)}
              className="flex w-full items-center justify-between p-4"
            >
              <span className="text-sm font-semibold text-foreground">🏥 Health Verdict</span>
              {showHealth ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showHealth && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="overflow-hidden">
                <div className="px-4 pb-4 space-y-2">
                  {Object.entries(report.healthVerdict).map(([key, val]) => (
                    <div key={key} className="flex gap-2 text-sm">
                      <span className="shrink-0 text-muted-foreground capitalize font-medium min-w-[80px]">{key}:</span>
                      <span className="text-foreground/80">{val}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Buying Advice */}
          <Section title="🛒 Buying Advice">
            <p className="text-sm text-muted-foreground leading-relaxed">{report.buyingAdvice}</p>
          </Section>

          {/* Public Sentiment */}
          <Section title="📊 Public Sentiment">
            <div className="space-y-2">
              <div className="flex h-6 w-full overflow-hidden rounded-full">
                <div className="bg-safe/70 transition-all" style={{ width: `${report.publicSentiment.positive}%` }} />
                <div className="bg-caution/70 transition-all" style={{ width: `${report.publicSentiment.neutral}%` }} />
                <div className="bg-harmful/70 transition-all" style={{ width: `${report.publicSentiment.negative}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>👍 {report.publicSentiment.positive}%</span>
                <span>😐 {report.publicSentiment.neutral}%</span>
                <span>👎 {report.publicSentiment.negative}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Based on {report.publicSentiment.totalReviews.toLocaleString()} reviews</p>
            </div>
          </Section>

          {/* Reviews */}
          <Section title="⭐ Top Authentic Reviews">
            <div className="space-y-2">
              {report.topReviews.map((review, i) => (
                <div key={i} className={`rounded-xl border p-3 ${sentimentColors[review.sentiment]}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm">{platformIcons[review.platform] || platformIcons.Other}</span>
                    <span className="text-[10px] font-medium text-foreground">{review.author}</span>
                    <span className="ml-auto">{sentimentIcons[review.sentiment]}</span>
                  </div>
                  <p className="text-xs text-foreground/70 leading-relaxed">"{review.text}"</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Sidebar - desktop only */}
        <div className="hidden lg:block space-y-3">
          <VerdictCard verdict={report.foodScoutVerdict} />
        </div>
      </div>

      {/* Comparison Modal */}
      {compareAlt && (
        <ComparisonModal
          original={report}
          alternative={compareAlt}
          onClose={() => setCompareAlt(null)}
          onAnalyze={onAnalyze}
        />
      )}
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function VerdictCard({ verdict }: { verdict: string }) {
  return (
    <div className="rounded-2xl p-4 border border-primary/20" style={{ background: 'var(--gradient-verdict)' }}>
      <h3 className="mb-2 text-xs font-semibold text-primary flex items-center gap-1.5">
        <Shield className="h-3.5 w-3.5" /> FoodScout's Verdict
      </h3>
      <p className="text-sm font-medium italic text-foreground/90 leading-relaxed">"{verdict}"</p>
    </div>
  );
}
