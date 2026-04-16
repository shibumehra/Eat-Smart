import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Camera, ImagePlus, ArrowLeft, Sparkles, Flame, Leaf, Loader2, RefreshCw, Languages } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { detectRegion, RegionCode } from '@/lib/regions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Step = 'mood' | 'upload' | 'loading' | 'results';

interface Dish {
  name: string;
  originalName?: string;
  description: string;
  calories: number | null;
  healthScore: number;
  foodType: 'veg' | 'non-veg' | 'unknown';
  spiceLevel?: 'mild' | 'medium' | 'spicy' | 'very-spicy';
  tags: string[];
  matchScore?: number;
  matchReason?: string;
}

interface MenuResult {
  restaurantName: string;
  detectedLanguage: string;
  mood: string;
  dishes: Dish[];
}

const MOOD_CHIPS = [
  'Spicy', 'Protein-rich', 'Light', 'Comfort', 'Healthy', 'Vegan',
  'Low-carb', 'Indulgent', 'Post-workout', 'Sweet'
];

const scoreColor = (s: number) =>
  s >= 7.5 ? 'text-success' : s >= 5 ? 'text-warning' : 'text-destructive';

const scoreBg = (s: number) =>
  s >= 7.5 ? 'bg-success/10 border-success/20' : s >= 5 ? 'bg-warning/10 border-warning/20' : 'bg-destructive/10 border-destructive/20';

export default function MenuScanner() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [region, setRegion] = useState<RegionCode>(detectRegion());
  const [step, setStep] = useState<Step>('mood');
  const [moodChips, setMoodChips] = useState<string[]>([]);
  const [moodText, setMoodText] = useState('');
  const [result, setResult] = useState<MenuResult | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const toggleChip = (c: string) => {
    setMoodChips(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const finalMood = () => {
    const parts = [...moodChips];
    if (moodText.trim()) parts.push(moodText.trim());
    return parts.join(', ');
  };

  const fileToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setStep('loading');
    try {
      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke('analyze-menu', {
        body: { image: base64, mood: finalMood() },
      });
      if (error) throw error;
      if (data?.error === 'NOT_MENU') {
        toast({ title: 'No menu detected', description: data.message, variant: 'destructive' });
        setStep('upload');
        return;
      }
      if (data?.error) throw new Error(data.error);
      setResult(data as MenuResult);
      setStep('results');
    } catch (e: any) {
      toast({ title: 'Scan failed', description: e.message || 'Try again with a clearer photo.', variant: 'destructive' });
      setStep('upload');
    }
  };

  const reset = () => {
    setResult(null);
    setMoodChips([]);
    setMoodText('');
    setStep('mood');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar region={region} onRegionChange={setRegion} />
      <main className="mx-auto max-w-3xl px-4 pt-20 pb-12">
        <button
          onClick={() => step === 'mood' || step === 'results' ? navigate('/') : setStep(step === 'upload' ? 'mood' : 'upload')}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        <AnimatePresence mode="wait">
          {step === 'mood' && (
            <motion.div
              key="mood"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-8"
            >
              <div className="text-center pt-4">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
                  <Sparkles className="h-3 w-3" /> Menu Intelligence
                </div>
                <h1 className="font-display text-3xl font-bold text-foreground lg:text-5xl leading-tight">
                  What's Your <span className="text-gradient">Mood?</span>
                </h1>
                <p className="mt-3 text-sm text-muted-foreground lg:text-base max-w-md mx-auto leading-relaxed">
                  Tell us how you're feeling and we'll rank every dish on the menu just for you.
                </p>
              </div>

              <div className="glass rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-3">✨ Quick Picks</h3>
                  <div className="flex flex-wrap gap-2">
                    {MOOD_CHIPS.map((c) => {
                      const active = moodChips.includes(c);
                      return (
                        <button
                          key={c}
                          onClick={() => toggleChip(c)}
                          className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                            active
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5'
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2">💬 Or describe it</h3>
                  <textarea
                    value={moodText}
                    onChange={(e) => setMoodText(e.target.value)}
                    placeholder="e.g. craving something warm and creamy, not too heavy"
                    rows={2}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
                  />
                </div>
              </div>

              <button
                onClick={() => setStep('upload')}
                className="w-full rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all shadow-md"
              >
                {moodChips.length || moodText.trim() ? 'Continue with Mood' : 'Skip & Scan Menu'}
              </button>
            </motion.div>
          )}

          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-8"
            >
              <div className="text-center pt-4">
                <h1 className="font-display text-3xl font-bold text-foreground lg:text-4xl leading-tight">
                  Scan the <span className="text-gradient">Menu</span>
                </h1>
                <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Snap a photo or upload one. Works with English, Hindi, Hinglish & more.
                </p>
                {finalMood() && (
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    <Sparkles className="h-3 w-3" /> Mood: {finalMood()}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => cameraRef.current?.click()}
                  className="glass rounded-3xl p-6 flex flex-col items-center gap-3 hover:shadow-md transition-all hover:-translate-y-0.5 active:scale-95"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                    <Camera className="h-7 w-7" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Camera</span>
                  <span className="text-[11px] text-muted-foreground text-center leading-tight">Take a live photo</span>
                </button>
                <button
                  onClick={() => galleryRef.current?.click()}
                  className="glass rounded-3xl p-6 flex flex-col items-center gap-3 hover:shadow-md transition-all hover:-translate-y-0.5 active:scale-95"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-md">
                    <ImagePlus className="h-7 w-7" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Gallery</span>
                  <span className="text-[11px] text-muted-foreground text-center leading-tight">Upload from device</span>
                </button>
              </div>

              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
            </motion.div>
          )}

          {step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 space-y-6"
            >
              <div className="relative mx-auto h-24 w-24">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <Loader2 className="absolute inset-0 m-auto h-8 w-8 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-display text-lg font-bold text-foreground">Reading your menu</p>
                <p className="text-xs text-muted-foreground">Translating · Identifying dishes · Scoring nutrition</p>
              </div>
            </motion.div>
          )}

          {step === 'results' && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Header */}
              <div className="glass rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {result.restaurantName && (
                      <h2 className="font-display text-lg font-bold text-foreground break-words">{result.restaurantName}</h2>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {result.dishes.length} dishes · {result.mood ? `Ranked for "${result.mood}"` : 'Ranked by health score'}
                    </p>
                  </div>
                  <button
                    onClick={reset}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary transition-all"
                  >
                    <RefreshCw className="h-3 w-3" /> New Scan
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Languages className="h-3 w-3" /> Detected: {result.detectedLanguage}
                </div>
              </div>

              {/* Dish cards */}
              <div className="space-y-3">
                {result.dishes.map((d, i) => (
                  <motion.div
                    key={`${d.name}-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display text-base font-bold text-foreground break-words">{d.name}</h3>
                          {d.foodType !== 'unknown' && (
                            <span className={`shrink-0 inline-flex items-center justify-center h-4 w-4 rounded-sm border ${
                              d.foodType === 'veg' ? 'border-success' : 'border-destructive'
                            }`}>
                              <span className={`h-2 w-2 rounded-full ${d.foodType === 'veg' ? 'bg-success' : 'bg-destructive'}`} />
                            </span>
                          )}
                        </div>
                        {d.originalName && d.originalName !== d.name && (
                          <p className="text-[11px] text-muted-foreground italic">{d.originalName}</p>
                        )}
                        <p className="text-xs text-muted-foreground leading-relaxed break-words">{d.description}</p>
                      </div>
                      <div className={`shrink-0 flex flex-col items-center justify-center rounded-xl border px-2.5 py-1.5 ${scoreBg(d.healthScore)}`}>
                        <span className={`font-display text-lg font-bold leading-none ${scoreColor(d.healthScore)}`}>
                          {d.healthScore.toFixed(1)}
                        </span>
                        <span className="text-[9px] text-muted-foreground mt-0.5">HEALTH</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap text-[11px]">
                      {d.calories !== null && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Flame className="h-3 w-3" /> {d.calories} kcal
                        </span>
                      )}
                      {d.spiceLevel && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground capitalize">
                          🌶️ {d.spiceLevel.replace('-', ' ')}
                        </span>
                      )}
                      {typeof d.matchScore === 'number' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 font-semibold">
                          {d.matchScore}% match
                        </span>
                      )}
                    </div>

                    {d.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {d.tags.map((t) => (
                          <span key={t} className="rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                            {t.replace('-', ' ')}
                          </span>
                        ))}
                      </div>
                    )}

                    {d.matchReason && (
                      <div className="rounded-lg bg-accent/5 border border-accent/10 px-3 py-2">
                        <p className="text-[11px] text-accent-foreground/80 leading-relaxed flex items-start gap-1.5">
                          <Leaf className="h-3 w-3 mt-0.5 shrink-0 text-accent" /> {d.matchReason}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
