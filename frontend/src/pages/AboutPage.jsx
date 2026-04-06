import { Link } from 'react-router-dom'

import { useScrollReveal } from '../hooks/useScrollReveal'

const coreValues = [
  {
    title: 'Transparency',
    description: 'We show what matters, clearly. No hidden logic. No confusing clutter.',
  },
  {
    title: 'Efficiency',
    description: 'We keep every action quick so budgeting fits real life, not the other way around.',
  },
  {
    title: 'Elegant Design',
    description: 'We believe calm visuals help us think better, decide faster, and spend with intent.',
  },
]

const featureCards = [
  {
    title: 'Simple',
    description: 'No clutter, just what you need to see your money with confidence.',
  },
  {
    title: 'Secure',
    description: 'Your data stays yours so you can plan in private and move with trust.',
  },
  {
    title: 'Smart',
    description: 'Insights stay useful, direct, and easy to act on the moment you need them.',
  },
]

export function AboutPage() {
  const containerRef = useScrollReveal()

  return (
    <div ref={containerRef} className="space-y-16 px-1 py-2 lg:space-y-20 lg:px-2">
      <section className="relative py-4 lg:py-6">
        <div className="about-glow-drift absolute -right-8 top-0 h-40 w-40 rounded-full bg-cyan-200/35 blur-3xl" />
        <div className="about-glow-drift about-delay-2 absolute left-1/3 top-20 h-32 w-32 rounded-full bg-slate-200/45 blur-3xl" />

        <div className="relative grid gap-10 px-1 sm:px-2 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:px-0">
          <article className="pt-4 lg:pt-8">
            <p className="scroll-reveal text-xs font-black uppercase tracking-[0.3em] text-cyan-700">About Us</p>
            <h1 className="scroll-reveal about-delay-1 mt-4 max-w-4xl text-4xl font-black tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-7xl">
              Money management, simplified.
            </h1>
            <p className="scroll-reveal about-delay-2 mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              We built SINOP for people who want control without the noise. We help us all spend with intention, track with clarity, and master money without the stress.
            </p>

            <div className="scroll-reveal reveal-soft about-delay-3 mt-8">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('sinop:open-auth', { detail: 'register' }))}
                className="inline-flex rounded-full bg-[linear-gradient(135deg,#22d3ee_0%,#67e8f9_100%)] px-6 py-3 text-sm font-bold tracking-[0.01em] text-slate-950 shadow-[0_18px_40px_rgba(34,211,238,0.2)] transition hover:-translate-y-0.5"
              >
                Start Saving Now
              </button>
            </div>
          </article>

          <div className="scroll-reveal reveal-right about-delay-2">
            <article className="about-panel-float rounded-4xl border border-slate-200/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(15,23,42,0.88)_100%)] p-7 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">Intentional Spending</p>
              <h2 className="mt-4 max-w-sm text-3xl font-black tracking-tight sm:text-4xl">
                Financial clarity should feel calm, not complicated.
              </h2>

              <div className="mt-8 space-y-6 border-t border-white/12 pt-6">
                <p className="text-sm leading-7 text-slate-300">
                  We created SINOP for people tired of messy spreadsheets, scattered notes, and budgeting tools that demand too much attention.
                </p>
                <p className="text-sm leading-7 text-slate-300">
                  We wanted something quieter, sharper, and easier to trust. Something that looks refined and works with intent.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-4xl border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(247,250,252,0.94)_100%)] px-6 py-8 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:px-8 sm:py-10">
        <div className="about-glow-drift absolute left-10 top-0 h-24 w-24 rounded-full bg-cyan-100/70 blur-3xl" />
        <div className="relative grid gap-5 lg:grid-cols-2 lg:gap-0">
          <article className="scroll-reveal reveal-left rounded-[1.75rem] bg-white/60 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7 lg:rounded-none lg:bg-transparent lg:px-8 lg:py-0 lg:shadow-none lg:border-r lg:border-slate-200/80">
            <div className="max-w-lg">
              <div className="scroll-reveal reveal-line h-1 w-14 rounded-full bg-[linear-gradient(90deg,#06b6d4_0%,#67e8f9_100%)]" />
              <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-cyan-700">Mission</p>
              <p className="mt-4 text-lg leading-8 text-slate-700 sm:text-[1.35rem] sm:leading-9">
                Helping people master their money without the stress.
              </p>
            </div>
          </article>

          <article className="scroll-reveal reveal-right about-delay-1 rounded-[1.75rem] bg-white/60 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7 lg:rounded-none lg:bg-transparent lg:px-8 lg:py-0 lg:shadow-none">
            <div className="max-w-lg">
              <div className="scroll-reveal reveal-line about-delay-2 h-1 w-14 rounded-full bg-[linear-gradient(90deg,#64748b_0%,#cbd5e1_100%)]" />
              <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-slate-500">The Why</p>
              <p className="mt-4 text-lg leading-8 text-slate-700 sm:text-[1.35rem] sm:leading-9">
                In a fast-paced world, simple budgeting creates focus. Less friction means better choices.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="relative px-1 py-2 sm:px-2 lg:px-0">
        <div className="about-glow-drift absolute right-8 top-0 h-24 w-24 rounded-full bg-cyan-100/60 blur-3xl" />
        <div className="relative">
          <div className="max-w-2xl border-b border-slate-200 pb-6">
            <p className="scroll-reveal text-xs font-black uppercase tracking-[0.3em] text-cyan-700">Core Values</p>
            <h2 className="scroll-reveal about-delay-1 mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Clear principles behind every decision we make.
            </h2>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3 lg:gap-8">
            {coreValues.map((value, index) => (
              <div key={value.title} className={`scroll-reveal reveal-soft about-delay-${index + 1}`}>
                <article className="about-value-card rounded-[1.75rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(248,250,252,0.85)_100%)] p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-black uppercase tracking-[0.26em] text-cyan-700">Core Value</p>
                    <span className="text-xs font-black tracking-[0.28em] text-slate-300">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-950">{value.title}</h3>
                  <p className="mt-4 text-base leading-8 text-slate-600">{value.description}</p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>


    </div>
  )
}
