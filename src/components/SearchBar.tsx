import { useState, useRef } from 'react';
import { Search, Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onImageCapture: (base64: string) => void;
  loading?: boolean;
}

export default function SearchBar({ onSearch, onImageCapture, loading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const openCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    closeCamera();
    onImageCapture(base64);
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setShowCamera(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        closeCamera();
        onImageCapture(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="relative">
        <div className="glass rounded-2xl p-1 flex items-center gap-1 glow-primary">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any food product..."
              className="w-full bg-transparent py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              disabled={loading}
            />
          </div>
          <button
            type="button"
            onClick={openCamera}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary"
          >
            <Camera className="h-4 w-4" />
          </button>
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="flex h-10 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-40"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              'Scan'
            )}
          </button>
        </div>
      </form>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-background/95 p-4"
          >
            <div className="relative w-full max-w-sm">
              <button onClick={closeCamera} className="absolute -top-10 right-0 text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>

              <div className="relative overflow-hidden rounded-2xl border border-border">
                <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-[3/4] object-cover bg-muted" />
                {/* Scan frame overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-48 w-48 rounded-2xl border-2 border-primary/60">
                    <div className="scanner-line h-0.5 w-full bg-primary/80 rounded" />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 rounded-xl border border-border bg-muted py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  📁 Gallery
                </button>
                <button
                  onClick={capturePhoto}
                  className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
                >
                  📸 Capture
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
