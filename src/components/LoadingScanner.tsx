import { motion } from 'framer-motion';

const steps = [
  { label: 'Scanning ingredients', emoji: '🧪' },
  { label: 'Checking reviews', emoji: '⭐' },
  { label: 'Verifying certifications', emoji: '🛡️' },
  { label: 'Building consensus', emoji: '💬' },
];

export default function LoadingScanner({ currentStep = 0 }: { currentStep?: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-8">
      {/* Simple spinner */}
      <motion.div
        className="h-12 w-12 rounded-full border-3 border-muted border-t-primary"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />

      {/* Steps list */}
      <div className="space-y-3 w-full max-w-xs">
        {steps.map((step, i) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
              i < currentStep
                ? 'bg-safe/10 text-safe'
                : i === currentStep
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted/50 text-muted-foreground'
            }`}
          >
            <span className="text-base">
              {i < currentStep ? '✓' : step.emoji}
            </span>
            <span>{step.label}</span>
            {i === currentStep && (
              <motion.span
                className="ml-auto text-xs text-muted-foreground"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ...
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
