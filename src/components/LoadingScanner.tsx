import { motion } from 'framer-motion';

const steps = [
  { label: 'Scanning ingredients', emoji: '🧪' },
  { label: 'Checking reviews', emoji: '⭐' },
  { label: 'Verifying certifications', emoji: '🛡️' },
  { label: 'Building report', emoji: '📊' },
];

export default function LoadingScanner({ currentStep = 0 }: { currentStep?: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      {/* Minimal pulsing dot loader */}
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-primary"
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>

      {/* Steps */}
      <div className="space-y-2 w-full max-w-xs">
        {steps.map((step, i) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              i < currentStep
                ? 'text-safe'
                : i === currentStep
                  ? 'text-primary'
                  : 'text-muted-foreground'
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
                transition={{ duration: 1.2, repeat: Infinity }}
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
