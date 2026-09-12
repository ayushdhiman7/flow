import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange?.(false)} />
      <div className="relative z-50 w-full max-w-lg mx-4">{children}</div>
    </div>
  )
}
export function DialogContent({ className, children, onClose }) {
  return (
    <div className={cn("bg-card border rounded-xl shadow-xl p-6 w-full relative animate-in", className)}>
      {onClose && <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
      {children}
    </div>
  )
}
export function DialogHeader({ className, ...props }) { return <div className={cn("space-y-1.5 mb-4", className)} {...props} /> }
export function DialogTitle({ className, ...props }) { return <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} /> }
export function DialogDescription({ className, ...props }) { return <p className={cn("text-sm text-muted-foreground", className)} {...props} /> }
export function DialogFooter({ className, ...props }) { return <div className={cn("flex justify-end gap-2 mt-6", className)} {...props} /> }
