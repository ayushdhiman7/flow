import { cn } from "@/lib/utils";

const labels = ["Welcome", "Profile", "Workspace", "Preferences", "Complete"];

export default function ProgressIndicator({ currentStep, totalSteps = 5 }) {
  return (
    <div className="w-full">
      {/* Desktop progress */}
      <div className="hidden sm:flex items-center gap-2">
        {labels.slice(0, totalSteps).map((label, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          return (
            <div key={label} className="flex items-center flex-1 gap-2 last:flex-none">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full grid place-items-center text-xs font-medium border transition-colors shadow-sm",
                    isCompleted && "bg-zinc-900 border-zinc-900 text-white",
                    isCurrent && "bg-zinc-900 border-zinc-900 text-white ring-4 ring-zinc-900/10",
                    !isCompleted && !isCurrent && "bg-white border-zinc-200 text-zinc-500"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <span className={cn("text-sm hidden lg:inline", isCurrent ? "font-medium text-foreground" : isCompleted ? "text-foreground" : "text-muted-foreground")}>
                  {label}
                </span>
              </div>
              {idx < totalSteps - 1 && (
                <div className={cn("h-px flex-1", idx < currentStep ? "bg-zinc-900" : "bg-zinc-200")} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile compact */}
      <div className="sm:hidden space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Step {currentStep + 1} of {totalSteps}</span>
          <span className="font-medium text-foreground">{labels[currentStep]}</span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
              key={idx}
              className={cn("h-1.5 flex-1 rounded-full transition-colors", idx <= currentStep ? "bg-zinc-900" : "bg-zinc-200")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
