import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import SearchBar from '@/components/SearchBar';
import LoadingScanner from '@/components/LoadingScanner';
import ProductReportView from '@/components/ProductReport';
import { detectRegion, RegionCode } from '@/lib/regions';
import { ProductReport } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Sparkles, Scan, Globe, ArrowLeft } from 'lucide-react';

const TRENDING = ['Maggi Noodles', 'Coca-Cola', 'Amul Butter', 'Lays Classic', 'Bournvita', 'Kurkure', 'Parle-G', 'Red Bull'];

const FEATURES = [
  { icon: Scan, title: 'AI-Powered Analysis', desc: 'Deep ingredient scanning powered by advanced AI models and real web data.' },
  { icon: Shield, title: 'Safety Verdicts', desc: 'Get health verdicts for diabetics, children, pregnant women & fitness enthusiasts.' },
  { icon: Globe, title: 'Region-Aware', desc: 'Certifications mapped to FSSAI, FDA, FSA & more based on your location.' },
  { icon: Sparkles, title: 'Smart Alternatives', desc: 'Discover healthier swaps with side-by-side comparison scores.' },
];

export default function Index() {
  const [region, setRegion] = useState<RegionCode>(detectRegion());
  const [report, setReport] = useState<ProductReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const [notFood, setNotFood] = useState<{ productName: string; explanation: string } | null>(null);
  const { toast } = useToast();
  const lastProductRef = useRef<string | null>(null);

  // Re-analyze when region changes and a report is showing
  useEffect(() => {
    if (lastProductRef.current && report) {
      analyzeProduct(lastProductRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);

  const analyzeProduct = async (name: string) => {
    lastProductRef.current = name;
    setReport(null);
    setNotFound(false);
    setNotFood(null);
    setLoading(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => Math.min(prev + 1, 3));
    }, 3000);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-product', {
        body: { productName: name, region },
      });
      if (error) throw error;
      if (data?.error === 'NOT_FOUND') {
        setNotFound(true);
      } else if (data?.error === 'NOT_FOOD') {
        setNotFood({ productName: data.productName || name, explanation: data.explanation || '' });
      } else {
        setReport(data as ProductReport);
      }
    } catch (err: any) {
      toast({ title: 'Analysis failed', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const handleImageCapture = async (base64: string) => {
    setReport(null);
    setNotFound(false);
    setNotFood(null);
    setLoading(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => Math.min(prev + 1, 3));
    }, 3000);

    try {
      const { data: idData, error: idError } = await supabase.functions.invoke('identify-product-image', {
        body: { image: base64 },
      });
      if (idError) throw idError;
      if (!idData?.productName) {
        setNotFound(true);
        return;
      }
      toast({ title: 'Product identified', description: idData.productName });
      
      const { data, error } = await supabase.functions.invoke('analyze-product', {
        body: { productName: idData.productName, region },
      });
      if (error) throw error;
      if (data?.error === 'NOT_FOUND') {
        setNotFound(true);
      } else {
        lastProductRef.current = idData.productName;
        setReport(data as ProductReport);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar region={region} onRegionChange={setRegion} />

      <main className="mx-auto max-w-5xl px-4 pt-20 pb-8">
        {!report && !loading && !notFound && !notFood && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            {/* Hero */}
            <div className="text-center pt-8 lg:pt-16">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
                <Sparkles className="h-3 w-3" /> AI-Powered Food Intelligence
              </div>
              <h1 className="font-display text-4xl font-bold text-foreground lg:text-6xl leading-tight">
                Know What You <span className="text-gradient">Eat</span>
              </h1>
              <p className="mt-4 text-sm text-muted-foreground lg:text-lg max-w-lg mx-auto leading-relaxed">
                Scan any food product for ingredients, safety scores, regulatory status & healthier alternatives — all grounded in real data.
              </p>
            </div>

            {/* Search */}
            <div className="max-w-lg mx-auto">
              <SearchBar onSearch={analyzeProduct} onImageCapture={handleImageCapture} />
            </div>

            {/* Trending */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-3 text-center">🔥 Trending</h3>
              <div className="flex gap-2 overflow-x-auto chip-scroll pb-2 justify-center flex-wrap">
                {TRENDING.map((name) => (
                  <button
                    key={name}
                    onClick={() => analyzeProduct(name)}
                    className="shrink-0 rounded-full border border-border bg-muted/50 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-primary hover:bg-primary/5 hover:shadow-sm"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="glass rounded-2xl p-4 text-center space-y-2 hover:shadow-md transition-shadow"
                >
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">{f.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* How it works */}
            <div className="text-center space-y-4">
              <h2 className="font-display text-lg font-bold text-foreground">How It Works</h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                {['Search or scan a product', 'AI analyzes ingredients & reviews', 'Get your health verdict'].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{i + 1}</span>
                    <span className="text-sm text-foreground/80">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {loading && <LoadingScanner currentStep={loadingStep} productName={lastProductRef.current || undefined} />}

        {notFound && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 space-y-4">
            <span className="text-5xl">🔍</span>
            <h2 className="font-display text-xl font-bold text-foreground break-words px-4">Product Not Found</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              We couldn't find enough real data for this product. Try a more specific name, brand, or variant.
            </p>
            <button
              onClick={() => { setNotFound(false); setReport(null); }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
            >
              <ArrowLeft className="h-4 w-4" /> Try a Food Product
            </button>
          </motion.div>
        )}

        {notFood && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 space-y-6 max-w-lg mx-auto">
            <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">Not a Food Product</p>
            <h2 className="font-display text-3xl font-bold text-foreground break-words px-4">{notFood.productName}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{notFood.explanation}</p>
            <div className="glass rounded-2xl p-5 text-sm text-muted-foreground leading-relaxed">
              {notFood.explanation}
            </div>
            <button
              onClick={() => { setNotFood(null); setReport(null); }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
            >
              <ArrowLeft className="h-4 w-4" /> Try a Food Product
            </button>
          </motion.div>
        )}

        {report && !loading && (
          <div>
            <div className="mb-4">
              <SearchBar onSearch={analyzeProduct} onImageCapture={handleImageCapture} loading={loading} />
            </div>
            <ProductReportView report={report} onAnalyze={analyzeProduct} region={region} />
          </div>
        )}
      </main>
    </div>
  );
}
