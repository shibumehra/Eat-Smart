import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import SearchBar from '@/components/SearchBar';
import LoadingScanner from '@/components/LoadingScanner';
import ProductReportView from '@/components/ProductReport';
import { detectRegion, RegionCode } from '@/lib/regions';
import { ProductReport } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const TRENDING = ['Maggi Noodles', 'Coca-Cola', 'Amul Butter', 'Lays Classic', 'Bournvita', 'Kurkure', 'Parle-G', 'Red Bull'];

export default function Index() {
  const [region, setRegion] = useState<RegionCode>(detectRegion());
  const [report, setReport] = useState<ProductReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  const analyzeProduct = async (name: string) => {
    setReport(null);
    setNotFound(false);
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
        {!report && !loading && !notFound && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* Hero */}
            <div className="text-center pt-8 lg:pt-16">
              <h1 className="font-display text-3xl font-bold text-foreground lg:text-5xl">
                Know What You <span className="text-gradient">Eat</span>
              </h1>
              <p className="mt-3 text-sm text-muted-foreground lg:text-base max-w-md mx-auto">
                AI-powered food analysis grounded in real-time web data. Scan any product for the truth.
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
                    className="shrink-0 rounded-full border border-border bg-muted/50 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/30 hover:text-primary hover:bg-primary/5"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {loading && <LoadingScanner currentStep={loadingStep} />}

        {notFound && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 space-y-4">
            <span className="text-5xl">🔍</span>
            <h2 className="font-display text-xl font-bold text-foreground">Product Not Found</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              We couldn't find enough real data for this product. Try a more specific name, brand, or variant.
            </p>
            <button
              onClick={() => { setNotFound(false); setReport(null); }}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
            >
              Search Again
            </button>
          </motion.div>
        )}

        {report && !loading && (
          <div>
            <div className="mb-4">
              <SearchBar onSearch={analyzeProduct} onImageCapture={handleImageCapture} loading={loading} />
            </div>
            <ProductReportView report={report} onAnalyze={analyzeProduct} />
          </div>
        )}
      </main>
    </div>
  );
}
