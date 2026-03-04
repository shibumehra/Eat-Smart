import { motion } from 'framer-motion';

const steps = [
  { label: 'Scanning ingredients', emoji: '🧪' },
  { label: 'Checking reviews', emoji: '⭐' },
  { label: 'Verifying certifications', emoji: '🛡️' },
  { label: 'Building report', emoji: '💬' },
];

interface LoadingScannerProps {
  currentStep?: number;
  productName?: string;
}

export default function LoadingScanner({ currentStep = 0, productName }: LoadingScannerProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-10">
      {/* Circular progress ring */}
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
          <circle
            cx="60" cy="60" r={radius}
            stroke="hsl(var(--muted))"
            strokeWidth="6"
            fill="none"
          />
          <motion.circle
            cx="60" cy="60" r={radius}
            stroke="hsl(var(--primary))"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={currentStep}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-2xl"
          >
            {steps[currentStep]?.emoji}
          </motion.span>
          <span className="text-[10px] text-muted-foreground mt-1">
            {currentStep + 1}/{steps.length}
          </span>
        </div>
      </div>

      {/* Product name */}
      {productName && (
        <div className="text-center px-4">
          <h2 className="font-display text-2xl font-bold text-foreground break-words">
            Analyzing {productName}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Scanning ingredients, reviews, regulations & expert opinions with AI
          </p>
        </div>
      )}

      {/* Steps appearing one by one */}
      <div className="space-y-2.5 w-full max-w-xs">
        {steps.map((step, i) => (
          i <= currentStep && (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium ${
                i < currentStep
                  ? 'text-safe/70'
                  : 'text-primary'
              }`}
            >
              <span className="text-sm shrink-0">
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
          )
        ))}
      </div>
    </div>
  );
}
