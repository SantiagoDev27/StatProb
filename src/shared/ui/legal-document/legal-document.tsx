import type { ReactNode } from "react";
import { ClockIcon } from "@/shared/ui/icons";

const strongStyles = "[&_strong]:font-semibold [&_strong]:text-foreground";

type LegalDocumentProps = {
  /** Línea superior, p. ej. "Última actualización: Noviembre de 2026". */
  meta: ReactNode;
  title: string;
  intro: ReactNode;
  children: ReactNode;
};

export function LegalDocument({ meta, title, intro, children }: LegalDocumentProps) {
  return (
    <article className="flex flex-col gap-12">
      <header className="flex flex-col gap-4">
        <p className="flex items-center gap-2 font-mono text-xs text-primary">
          <ClockIcon width={14} height={14} />
          {meta}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <div className={`text-[15px] leading-7 text-muted ${strongStyles}`}>{intro}</div>
      </header>
      {children}
    </article>
  );
}

type LegalSectionProps = {
  /** Numeración visible de la sección, p. ej. "01." */
  index: string;
  title: string;
  children: ReactNode;
};

export function LegalSection({ index, title, children }: LegalSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex items-baseline gap-3 text-xl font-semibold text-foreground">
        <span className="font-mono text-sm text-primary">{index}</span>
        {title}
      </h2>
      <div className={`flex flex-col gap-4 text-[15px] leading-7 text-muted ${strongStyles}`}>
        {children}
      </div>
    </section>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col gap-3">{children}</ul>;
}

export function LegalListItem({ children }: { children: ReactNode }) {
  return (
    <li className="relative pl-5 before:absolute before:left-0 before:top-[0.7em] before:size-1.5 before:rounded-full before:bg-primary">
      {children}
    </li>
  );
}

type LegalCalloutProps = {
  title?: string;
  children: ReactNode;
};

export function LegalCallout({ title, children }: LegalCalloutProps) {
  return (
    <aside className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-5 text-sm leading-6">
      {title && (
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
          {title}
        </p>
      )}
      <div>{children}</div>
    </aside>
  );
}

