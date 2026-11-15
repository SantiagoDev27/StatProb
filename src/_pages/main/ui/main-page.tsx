import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inicio",
};

export function MainPage() {
  return (
    <main className="flex flex-1 items-center justify-center">
      <h1 className="font-mono text-5xl font-bold tracking-widest text-primary">WIP</h1>
    </main>
  );
}

