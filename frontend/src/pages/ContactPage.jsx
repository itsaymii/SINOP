export function ContactPage() {
  return (
    <section className="relative mx-auto max-w-4xl px-1 py-4 sm:px-2 lg:px-0">
      <div className="about-glow-drift absolute -left-8 top-4 h-32 w-32 rounded-full bg-cyan-200/30 blur-3xl" />
      <div className="about-glow-drift about-delay-2 absolute -right-6 bottom-6 h-28 w-28 rounded-full bg-slate-200/35 blur-3xl" />

      <article className="scroll-reveal relative overflow-hidden rounded-[2.2rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(247,250,252,0.92)_100%)] px-6 py-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:px-8 sm:py-10 lg:px-12">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-700">Contact</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
          Makipag-ugnayan sa Sinop.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
          Kung may tanong ka tungkol sa product, partnership, o support, puwede kang mag-message sa amin sa mga detalye sa ibaba.
        </p>

        <div className="mx-auto mt-10 grid max-w-3xl gap-5 text-left sm:grid-cols-3">
          <article className="rounded-[1.6rem] border border-slate-200/80 bg-white/85 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Email</p>
            <p className="mt-3 text-base font-semibold text-slate-950">support@sinop.app</p>
          </article>
          <article className="rounded-[1.6rem] border border-slate-200/80 bg-white/85 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Phone</p>
            <p className="mt-3 text-base font-semibold text-slate-950">+63 917 000 1234</p>
          </article>
          <article className="rounded-[1.6rem] border border-slate-200/80 bg-white/85 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Office Hours</p>
            <p className="mt-3 text-base font-semibold text-slate-950">Mon to Fri, 9:00 AM to 6:00 PM</p>
          </article>
        </div>
      </article>
    </section>
  )
}
