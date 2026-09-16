import splashAsset from '@/assets/eatsmart-splash.jpg.asset.json';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-primary" role="status" aria-label="EatSmart is opening">
      <img
        src={splashAsset.url}
        alt="EatSmart"
        className="h-full w-full object-cover motion-safe:animate-pulse"
        onError={(event) => {
          event.currentTarget.src = '/favicon.png';
          event.currentTarget.className = 'h-24 w-24 rounded-2xl object-cover shadow-lg';
        }}
      />
    </div>
  );
}