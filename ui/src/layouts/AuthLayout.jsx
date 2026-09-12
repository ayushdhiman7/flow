import { Link } from "react-router-dom";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex">
      {/* Left branding / visual */}
      <div className="hidden lg:flex lg:w-[46%] bg-zinc-900 text-white flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: `24px 24px`
        }} />
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
            <div className="h-8 w-8 rounded-lg bg-white text-zinc-900 grid place-items-center font-bold text-sm">◈</div>
            Flow
          </Link>
        </div>
        <div className="relative z-10 space-y-4">
          <blockquote className="text-lg leading-relaxed font-light text-zinc-100">
            “Flow helps teams move faster — boards, tasks, and chat in one calm place.”
          </blockquote>
          <p className="text-sm text-zinc-400">Trusted by modern product teams.</p>
        </div>
        <div className="relative z-10 text-xs text-zinc-500">
          © {new Date().getFullYear()} Flow. All rights reserved.
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Mobile header */}
        <div className="lg:hidden p-6 flex items-center gap-2 font-semibold">
          <div className="h-8 w-8 rounded-lg bg-zinc-900 text-white grid place-items-center font-bold text-sm">◈</div>
          Flow
        </div>
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-[420px] space-y-6">
            {(title || subtitle) && (
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                {subtitle && <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
