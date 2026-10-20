const foundations = [
  'API NestJS preparada',
  'React + Tailwind configurados',
  'PostgreSQL disponível via Docker',
  'Prisma 7 pronto para a modelagem',
];

export function App() {
  return (
    <main className="min-h-screen bg-stone-950 px-6 py-10 text-stone-100 sm:px-10 lg:px-16">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-stone-900 shadow-2xl shadow-black/40">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-5 sm:px-10">
          <a className="text-xl font-semibold tracking-tight" href="/">
            Bookly<span className="text-emerald-400">.</span>
          </a>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
            Fundação pronta
          </span>
        </header>

        <section className="grid gap-12 px-6 py-16 sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-16 lg:py-24">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-emerald-400">
              Agenda sem complicação
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Seu tempo organizado. Seus clientes bem atendidos.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-stone-400">
              O Bookly permitirá que profissionais compartilhem horários livres sem abrir mão do controle sobre a própria agenda.
            </p>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <p className="text-sm font-medium text-stone-400">Fase 1</p>
            <h2 className="mt-2 text-2xl font-semibold">Base técnica</h2>
            <ul className="mt-7 space-y-4">
              {foundations.map((foundation) => (
                <li className="flex items-center gap-3 text-stone-300" key={foundation}>
                  <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-400" />
                  {foundation}
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <footer className="border-t border-white/10 px-6 py-5 text-sm text-stone-500 sm:px-10">
          Disponibilidade pública. Confirmação humana. Controle profissional.
        </footer>
      </div>
    </main>
  );
}
