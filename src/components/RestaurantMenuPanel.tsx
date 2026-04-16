import { useState } from 'react';
import { Search, Camera, MapPin, Utensils } from 'lucide-react';

export default function RestaurantMenuPanel() {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // TODO: implement restaurant menu analysis
    }
  };

  return (
    <div className="space-y-5">
      {/* Search */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="glass rounded-2xl p-1 flex items-center gap-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search restaurant or menu item..."
              className="w-full bg-transparent py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim()}
            className="flex h-10 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-40"
          >
            Scan
          </button>
        </div>
      </form>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button className="glass rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Camera className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs font-semibold text-foreground">Scan Menu</span>
          <span className="text-[10px] text-muted-foreground text-center leading-tight">Take a photo of any restaurant menu</span>
        </button>
        <button className="glass rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <MapPin className="h-5 w-5 text-accent" />
          </div>
          <span className="text-xs font-semibold text-foreground">Nearby</span>
          <span className="text-[10px] text-muted-foreground text-center leading-tight">Find analyzed restaurants near you</span>
        </button>
      </div>

      {/* Popular Restaurants */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground mb-3">🍽️ Popular Restaurants</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 flex-wrap">
          {['McDonald\'s', 'Subway', 'Domino\'s', 'KFC', 'Pizza Hut', 'Starbucks'].map((name) => (
            <button
              key={name}
              className="shrink-0 rounded-full border border-border bg-muted/50 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-primary hover:bg-primary/5 hover:shadow-sm"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Coming Soon Note */}
      <div className="glass rounded-2xl p-4 text-center space-y-2">
        <Utensils className="h-8 w-8 text-primary/40 mx-auto" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Restaurant menu analysis is coming soon! You'll be able to scan menus, get health scores for dishes, and find the healthiest options at any restaurant.
        </p>
      </div>
    </div>
  );
}
