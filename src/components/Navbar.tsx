import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { REGIONS, RegionCode } from '@/lib/regions';
import { ChevronDown, LogOut, User, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  region: RegionCode;
  onRegionChange: (r: RegionCode) => void;
}

export default function Navbar({ region, onRegionChange }: NavbarProps) {
  const { user, signOut } = useAuth();
  const [showRegion, setShowRegion] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  const currentRegion = REGIONS.find(r => r.code === region);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <button onClick={() => navigate('/')} className="font-display text-xl font-bold text-gradient">
          FoodScout
        </button>

        <div className="flex items-center gap-2">
          {/* Region Selector */}
          <div className="relative">
            <button
              onClick={() => { setShowRegion(!showRegion); setShowProfile(false); }}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{currentRegion?.label.split(' ')[0]}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {showRegion && (
              <div className="absolute right-0 top-full mt-1 glass rounded-xl p-1 min-w-[140px] shadow-lg">
                {REGIONS.map((r) => (
                  <button
                    key={r.code}
                    onClick={() => { onRegionChange(r.code); setShowRegion(false); }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
                      region === r.code ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => { setShowProfile(!showProfile); setShowRegion(false); }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
            >
              <User className="h-4 w-4" />
            </button>
            {showProfile && (
              <div className="absolute right-0 top-full mt-1 glass rounded-xl p-1 min-w-[150px] shadow-lg">
                <button
                  onClick={() => { navigate('/profile'); setShowProfile(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                >
                  <User className="h-3.5 w-3.5" /> Profile
                </button>
                <button
                  onClick={() => { signOut(); setShowProfile(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-destructive hover:bg-muted transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
