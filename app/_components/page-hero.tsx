export function PageHero({
  eyebrow,
  title,
  lead,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="border-b border-black/5 bg-brand-50/50 px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {eyebrow ? <p className="text-sm font-semibold text-brand-600">{eyebrow}</p> : null}
        <h1 className="mt-2 text-3xl font-bold text-ink-900 sm:text-4xl">{title}</h1>
        {lead ? <p className="mt-4 max-w-2xl text-ink-700">{lead}</p> : null}
      </div>
    </div>
  );
}
