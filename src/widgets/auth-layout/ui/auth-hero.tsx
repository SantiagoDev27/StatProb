import { cn } from "@/shared/lib";
import { Logo } from "@/shared/ui/logo";
import { NormalDistributionChart } from "./normal-distribution-chart";

export function AuthHero({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "relative flex-col gap-6 overflow-hidden rounded-2xl border border-primary/15 p-8",
        "bg-linear-to-br from-primary/10 via-surface to-accent/10",
        "shadow-[0_0_80px_-30px_var(--color-primary)]",
        className,
      )}
    >
      <Logo />

      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground">
          Modelado Estadístico y Análisis{" "}
          <span className="text-primary">Probabilístico.</span>
        </h1>
        <p className="text-sm leading-6 text-muted">
          Calcula distribuciones continuas y discretas, contrasta hipótesis en tiempo
          real, gestiona matrices de datos cuantitativos y cualitativos, y genera
          diagnósticos automatizados en segundos.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-background/60 p-4">
        <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-wider">
          <span className="flex items-center gap-2 text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            Distribución normal estándar N(0, 1)
          </span>
          <span className="text-muted">μ = 0 · σ = 1</span>
        </div>

        <div className="flex justify-center gap-2 font-mono text-[10px]">
          <span className="rounded-md border border-border bg-surface px-2 py-1 text-foreground">
            P(−1.96 ≤ Z ≤ 1.96)
          </span>
          <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-primary">
            = 0.95
          </span>
        </div>

        <NormalDistributionChart />
      </div>
    </section>
  );
}

