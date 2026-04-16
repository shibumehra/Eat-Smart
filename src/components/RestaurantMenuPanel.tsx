import { useNavigate } from 'react-router-dom';
import { Camera, ImagePlus, Sparkles, Languages, Utensils } from 'lucide-react';

export default function RestaurantMenuPanel() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          <Sparkles className="h-3 w-3" /> Menu Intelligence
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">
          Scan Any <span className="text-gradient">Menu</span>
        </h2>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
          Get nutrition, health scores & mood-based picks for every dish.
        </p>
      </div>

      {/* Camera + Gallery */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/menu')}
          className="glass rounded-2xl p-5 flex flex-col items-center gap-2.5 hover:shadow-md transition-all hover:-translate-y-0.5 active:scale-95"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <Camera className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold text-foreground">Camera</span>
          <span className="text-[10px] text-muted-foreground text-center leading-tight">Take a live photo</span>
        </button>
        <button
          onClick={() => navigate('/menu')}
          className="glass rounded-2xl p-5 flex flex-col items-center gap-2.5 hover:shadow-md transition-all hover:-translate-y-0.5 active:scale-95"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-md">
            <ImagePlus className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold text-foreground">Gallery</span>
          <span className="text-[10px] text-muted-foreground text-center leading-tight">Upload from device</span>
        </button>
      </div>

      {/* Feature notes */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="glass rounded-xl p-3 flex items-center gap-2">
          <Languages className="h-4 w-4 text-primary shrink-0" />
          <span className="text-[11px] text-muted-foreground leading-tight">Hindi, Hinglish & more</span>
        </div>
        <div className="glass rounded-xl p-3 flex items-center gap-2">
          <Utensils className="h-4 w-4 text-accent shrink-0" />
          <span className="text-[11px] text-muted-foreground leading-tight">Mood-based ranking</span>
        </div>
      </div>

      <button
        onClick={() => navigate('/menu')}
        className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all shadow-md"
      >
        Start Scanning →
      </button>
    </div>
  );
}
