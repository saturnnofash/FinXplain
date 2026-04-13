"use client";

interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

const stepLabels = ["About You", "Your Finances", "Your Goals"];

export default function ProgressBar({
  currentStep,
  totalSteps = 3,
}: ProgressBarProps) {
  return (
    <div className="flex items-center gap-3 w-full mb-6">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isDone = step < currentStep;

        return (
          <div key={step} className="flex-1 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-medium ${
                  isActive
                    ? "text-accent-teal"
                    : isDone
                    ? "text-accent-teal/60"
                    : "text-text-muted"
                }`}
              >
                Step {step}
              </span>
              <span className="text-xs text-text-muted">{stepLabels[i]}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.1)]">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isDone
                    ? "bg-accent-teal/60 w-full"
                    : isActive
                    ? "bg-accent-teal w-full"
                    : "w-0"
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
