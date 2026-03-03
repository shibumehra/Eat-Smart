import { motion } from 'framer-motion';

const steps = ['Ingredients', 'Reviews', 'Regulatory', 'Consensus'];
const stepEmojis = ['🧪', '⭐', '🛡️', '💬'];

export default function LoadingScanner({ currentStep = 0 }: { currentStep?: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-10">
      {/* Animated scanner */}
      <div className="relative h-44 w-44">
        {/* Outer ring pulse */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/20"
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Middle ring */}
        <motion.div
          className="absolute inset-4 rounded-full border border-primary/30"
          animate={{ scale: [1, 0.92, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        />
        {/* Inner circle with glow */}
        <motion.div
          className="absolute inset-8 rounded-full bg-primary/5 border border-primary/20"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Rotating arc */}
        <motion.div
          className="absolute inset-2"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle
              cx="50" cy="50" r="46"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="40 250"
              strokeLinecap="round"
              opacity="0.6"
            />
          </svg>
        </motion.div>
        {/* Center emoji */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            key={currentStep}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl"
          >
            {stepEmojis[currentStep] || '🔍'}
          </motion.span>
        </div>
      </div>

      {/* Steps progress */}
      <div className="flex items-center gap-1">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center">
            <motion.div
              className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-all ${
                i < currentStep
                  ? 'bg-primary/20 text-primary'
                  : i === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground'
              }`}
              animate={i === currentStep ? { scale: [1, 1.03, 1] } : {}}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              {i < currentStep ? '✓' : stepEmojis[i]} {step}
            </motion.div>
            {i < steps.length - 1 && (
              <div className={`w-4 h-0.5 mx-0.5 rounded ${i < currentStep ? 'bg-primary/40' : 'bg-muted/30'}`} />
            )}
          </div>
        ))}
      </div>

      <motion.p
        className="text-sm text-muted-foreground"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Analyzing with real-time data...
      </motion.p>
    </div>
  );
}
