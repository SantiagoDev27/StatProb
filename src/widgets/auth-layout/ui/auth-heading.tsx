type AuthHeadingProps = {
  title: string;
  description: string;
};

export function AuthHeading({ title, description }: AuthHeadingProps) {
  return (
    <header className="flex flex-col gap-2">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
      <p className="text-sm leading-6 text-muted">{description}</p>
    </header>
  );
}

