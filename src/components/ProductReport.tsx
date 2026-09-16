import { lazy, Suspense, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductReport as ReportType, Alternative } from '@/lib/types';
import ScoreRing from './ScoreRing';
import { ChevronDown, ChevronUp, Shield, Info, X } from 'lucide-react';

const ComparisonModal = lazy(() => import('./ComparisonModal'));

const verdictColors = { Buy: 'bg-safe/15 text-safe', Avoid: 'bg-harmful/15 text-harmful', 'Try Once': 'bg-caution/15 text-caution' };
const ingredientColors = { safe: 'bg-safe/10 text-safe border-safe/20', caution: 'bg-caution/10 text-caution border-caution/20', harmful: 'bg-harmful/10 text-harmful border-harmful/20', unknown: 'bg-muted text-muted-foreground border-border' };

const healthIcons: Record<string, string> = { diabetics: '🩸', children: '👶', pregnant: '🤰', fitness: '💪', general: '👤' };
const healthLabels: Record<string, string> = { diabetics: 'Diabetics', children: 'Children', pregnant: 'Pregnant Women', fitness: 'Fitness', general: 'General' };

function getHealthColor(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes('avoid') || lower.includes('not suitable') || lower.includes('not recommended')) return 'text-harmful';
  if (lower.includes('moderation') || lower.includes('sparingly') || lower.includes('caution') || lower.includes('limit')) return 'text-caution';
  if (lower.includes('safe') || lower.includes('good') || lower.includes('recommended') || lower.includes('beneficial')) return 'text-safe';
  return 'text-muted-foreground';
}

function getHealthDot(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes('avoid') || lower.includes('not suitable') || lower.includes('not recommended')) return 'bg-harmful';
  if (lower.includes('moderation') || lower.includes('sparingly') || lower.includes('caution') || lower.includes('limit')) return 'bg-caution';
  if (lower.includes('safe') || lower.includes('good') || lower.includes('recommended') || lower.includes('beneficial')) return 'bg-safe';
  return 'bg-muted-foreground';
}

interface Props {
  report: ReportType;
  onAnalyze: (name: string) => void;
  region?: string;
}

export default function ProductReportView({ report, onAnalyze, region }: Props) {
  const [expandedAbout, setExpandedAbout] = useState(false);
  const [expandedIngredients, setExpandedIngredients] = useState(false);
  const [expandedIngredient, setExpandedIngredient] = useState<string | null>(null);
  const [showHealth, setShowHealth] = useState(true);
  
  const [compareAlt, setCompareAlt] = useState<Alternative | null>(null);
  const [expandedPros, setExpandedPros] = useState(false);
  const [showRegTooltip, setShowRegTooltip] = useState(false);

  const regIcon = report.regulatoryStatus === 'Certified' || report.regulatoryStatus === 'Compliant' ? '✅' : report.regulatoryStatus === 'Non-Compliant' || report.regulatoryStatus === 'Not Certified' ? '❌' : '⚠️';
  const regionAuthority: Record<string, string> = { IN: 'FSSAI', US: 'FDA', UK: 'FSA', EU: 'EFSA', AU: 'FSANZ', CA: 'CFIA' };
  const currentAuthority = regionAuthority[region || 'IN'] || 'FSSAI';


  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-8">
      {/* Header */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-start gap-4">
          <ScoreRing score={report.overallScore} maxScore={10} size={80} strokeWidth={5} />
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-lg font-bold text-foreground break-words">{report.productName}</h2>
            <p className="text-xs text-muted-foreground">{report.brand} · {report.category}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${verdictColors[report.verdict]}`}>
                {report.verdict}
              </span>
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                {report.foodType === 'veg' ? '🟢 Veg' : report.foodType === 'non-veg' ? '🔴 Non-Veg' : '⚪ Unknown'}
              </span>
              {report.sourceName && (
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${report.sourceStatus === 'verified' ? 'bg-safe/10 text-safe' : 'bg-caution/10 text-caution'}`}>
                  {report.sourceStatus === 'verified' ? '✓ Verified facts' : 'Limited source data'} · {report.sourceName}
                </span>
              )}
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
        {/* Regulatory */}
        <div className="glass rounded-xl p-3 relative min-w-0">
          <div className="flex flex-col items-center">
            <span className="text-2xl">{regIcon}</span>
            <p className="mt-1 max-w-full break-words text-center text-xs font-medium leading-tight text-foreground">{report.regulatoryStatus}</p>
            <p className="text-[10px] text-muted-foreground">{currentAuthority}</p>
          </div>
          <button onClick={() => setShowRegTooltip(!showRegTooltip)} className="absolute right-2 top-2 z-10 text-muted-foreground hover:text-foreground" aria-label="Show regulatory details">
            <Info className="h-3 w-3" />
          </button>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <ScoreRing score={report.valueForMoney} maxScore={10} size={56} strokeWidth={4} />
          <p className="mt-1 text-[10px] text-muted-foreground">Value for Money</p>
        </div>
      </div>

      {/* Content - 2 col layout on desktop */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-4 space-y-3 lg:space-y-0">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-3">
          {/* About */}
          <Section title="📋 About This Product">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {expandedAbout ? report.about : report.about.slice(0, 120) + (report.about.length > 120 ? '...' : '')}
            </p>
            {report.about.length > 120 && (
              <button onClick={() => setExpandedAbout(!expandedAbout)} className="text-xs text-primary font-medium mt-1 hover:underline">
                {expandedAbout ? 'Show less' : 'Read more'}
              </button>
            )}
          </Section>

          {/* Verdict & Health Verdict - mobile only */}
          <div className="lg:hidden">
            <VerdictCard verdict={report.foodScoutVerdict} />
          </div>
          <div className="lg:hidden">
            <HealthVerdictSection report={report} showHealth={showHealth} setShowHealth={setShowHealth} />
          </div>

          {/* Ingredient Analysis */}
          <div className="glass rounded-2xl p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">🧪 Ingredient Analysis ({report.ingredients.length})</h3>
            {/* Ingredient Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {report.ingredients.map((ing) => {
                const statusIcons = { safe: '✅', caution: '⚠️', harmful: '❌', unknown: '❓' };
                const tagColors = { safe: 'bg-safe/10 text-safe border-safe/20', caution: 'bg-caution/10 text-caution border-caution/20', harmful: 'bg-harmful/10 text-harmful border-harmful/20', unknown: 'bg-muted text-muted-foreground border-border' };
                return (
                  <span key={ing.name} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${tagColors[ing.status]}`}>
                    {statusIcons[ing.status]} {ing.name}
                  </span>
                );
              })}
            </div>
            {/* View ingredient details toggle */}
            <button
              onClick={() => setExpandedIngredients(!expandedIngredients)}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              {expandedIngredients ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expandedIngredients ? 'Hide details' : 'View ingredient details'}
            </button>
            <AnimatePresence>
              {expandedIngredients && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-2">
                    {report.ingredients.map((ing) => (
                      <div key={ing.name} className={`rounded-xl border p-3 ${ingredientColors[ing.status]}`}>
                        <p className="text-xs font-bold mb-1">{ing.name}</p>
                        <p className="text-xs leading-relaxed opacity-80 break-words">{ing.detail}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Alternatives */}
          <Section title="💡 Healthier Alternatives">
            <div className="space-y-2">
              {report.healthierAlternatives.map((alt) => (
                <div key={alt.name} className="glass rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{alt.name}</p>
                    <p className="text-[10px] text-muted-foreground">{alt.brand}{alt.reason ? ` · ${alt.reason}` : ''}</p>
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

          {/* Pros & Cons - expandable */}
          <div className="glass rounded-2xl overflow-hidden">
            <button onClick={() => setExpandedPros(!expandedPros)} className="flex w-full items-center justify-between p-4">
              <span className="text-sm font-semibold text-foreground">✅ Top Pros & Cons</span>
              {expandedPros ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            <AnimatePresence>
              {expandedPros && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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

        </div>

        {/* Desktop sidebar: Verdict + Health Verdict */}
        <div className="hidden lg:block space-y-3">
          <VerdictCard verdict={report.foodScoutVerdict} />
          <HealthVerdictSection report={report} showHealth={showHealth} setShowHealth={setShowHealth} />
        </div>
      </div>

      {compareAlt && (
        <Suspense fallback={null}>
          <ComparisonModal original={report} alternative={compareAlt} onClose={() => setCompareAlt(null)} onAnalyze={onAnalyze} />
        </Suspense>
      )}
      {createPortal(
        <AnimatePresence>
          {showRegTooltip && (
            <>
              <motion.button
                type="button"
                aria-label="Close regulatory details"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowRegTooltip(false)}
                className="fixed inset-0 z-[60] bg-foreground/15"
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label={`Regulatory Info (${currentAuthority})`}
                initial={{ opacity: 0, x: 12, y: '-50%' }}
                animate={{ opacity: 1, x: 0, y: '-50%' }}
                exit={{ opacity: 0, x: 12, y: '-50%' }}
                className="fixed right-4 top-1/2 z-[70] max-h-[70vh] w-[min(18rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-border bg-card p-4 text-left text-xs text-muted-foreground shadow-lg"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="break-words font-medium text-foreground">Regulatory Info ({currentAuthority})</p>
                  <button onClick={() => setShowRegTooltip(false)} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Close regulatory details">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="break-words leading-relaxed">{report.regulatoryReasoning}</p>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
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
        <Shield className="h-3.5 w-3.5" /> EatSmart's Verdict
      </h3>
      <p className="text-sm font-medium italic text-foreground/90 leading-relaxed">"{verdict}"</p>
    </div>
  );
}

function HealthVerdictSection({ report, showHealth, setShowHealth }: { report: ReportType; showHealth: boolean; setShowHealth: (v: boolean) => void }) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button onClick={() => setShowHealth(!showHealth)} className="flex w-full items-center justify-between p-4">
        <span className="text-sm font-semibold text-foreground">🏥 Health Verdict</span>
        {showHealth ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {showHealth && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Who should be careful</p>
              <div className="space-y-4">
                {Object.entries(report.healthVerdict).map(([key, val]) => (
                  <div key={key} className="flex items-start gap-3">
                    <div className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${getHealthDot(val)}`} />
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm">{healthIcons[key] || '👤'}</span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">{healthLabels[key] || key}</span>
                      </div>
                      <p className={`text-sm leading-relaxed ${getHealthColor(val)}`}>{val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
