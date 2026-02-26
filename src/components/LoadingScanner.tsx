import { motion } from 'framer-motion';

const steps = ['Ingredients', 'Reviews', 'Regulatory', 'Consensus'];

export default function LoadingScanner({ currentStep = 0 }: { currentStep?: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-8">
      {/* Scanner animation */}
      <div className="relative h-40 w-40">
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-primary/30"
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-4 rounded-xl border border-primary/50"
          animate={{ scale: [1, 0.95, 1], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="h-0.5 w-3/4 rounded bg-primary"
            animate={{ y: [-50, 50, -50], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl">🔍</span>
        </div>
      </div>

      {/* Steps */}
      <div className="flex gap-3 flex-wrap justify-center">
        {steps.map((step, i) => (
          <motion.div
            key={step}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              i <= currentStep
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
            animate={i === currentStep ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {i < currentStep ? '✓' : i === currentStep ? '⏳' : '○'} {step}
          </motion.div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground animate-pulse">Analyzing product with real-time data...</p>
    </div>
  );
}
