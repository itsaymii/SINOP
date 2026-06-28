import { Link } from 'react-router-dom'

import landingImage from '../assets/Landing-transparent.png'
import { homeFeatureCards } from '../data/siteContent'
import { useScrollReveal } from '../hooks/useScrollReveal'

export function HomePage() {
  const containerRef = useScrollReveal()

  return (
    <div ref={containerRef} className="space-y-16 px-1 py-10 lg:space-y-24 lg:px-2 lg:py-16">
      <section className="relative py-4 lg:py-8">
        <div className="about-glow-drift absolute -left-10 top-10 h-36 w-36 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="about-glow-drift about-delay-2 absolute right-0 top-0 h-44 w-44 rounded-full bg-slate-200/35 blur-3xl" />

        <div className="relative grid gap-10 px-1 sm:px-2 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-0">
          <div className="space-y-6">
            <div className="space-y-5">
              <h1 className="scroll-reveal about-delay-1 max-w-3xl text-5xl font-black leading-[0.92] tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-7xl">
                Spend with clarity today, so tomorrow feels lighter.
              </h1>
              <p className="scroll-reveal about-delay-2 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Sinop brings intentional spending into a modern financial tool that feels clear, calm, and easy to trust. Track daily money decisions with less noise and more confidence.
              </p>
            </div>

            <div className="scroll-reveal reveal-soft about-delay-3 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('sinop:open-auth', { detail: 'register' }))}
                className="inline-flex rounded-full bg-[linear-gradient(135deg,#22d3ee_0%,#67e8f9_100%)] px-6 py-3 text-sm font-bold tracking-[0.01em] text-slate-950 shadow-[0_18px_40px_rgba(34,211,238,0.2)] transition hover:-translate-y-0.5"
              >
                Start your financial journey
              </button>
              <Link
                to="/about"
                className="inline-flex rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-bold tracking-[0.01em] text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-white"
              >
                Learn more
              </Link>
            </div>
          </div>

          <div className="scroll-reveal reveal-right about-delay-2 relative flex items-center justify-center py-4 lg:py-0">
            <div className="floating-landing-glow absolute inset-x-8 inset-y-10 hidden rounded-full lg:block" />
            <div className="home-orbit absolute left-4 top-8 hidden h-20 w-20 rounded-full border border-cyan-200/50 bg-white/40 blur-sm lg:block" />
            <img
              src={landingImage}
              alt="Sinop landing preview"
              className="floating-landing relative z-10 h-full w-full max-w-2xl object-contain drop-shadow-[0_30px_60px_rgba(15,23,42,0.18)]"
            />
          </div>
        </div>
      </section>

      <section className="relative px-1 py-2 sm:px-2 lg:px-0">
        <div className="max-w-2xl border-b border-slate-200 pb-6">
          <p className="scroll-reveal text-xs font-black uppercase tracking-[0.3em] text-cyan-700">Features</p>
          <h2 className="scroll-reveal about-delay-1 mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Built to make every money habit easier to see and easier to improve.
          </h2>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3 lg:gap-8">
          {homeFeatureCards.map((feature, index) => (
            <div key={feature.title} className={`scroll-reveal reveal-soft h-full about-delay-${index + 1}`}>
              <article className="flex h-full flex-col rounded-[1.75rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(247,250,252,0.88)_100%)] p-7 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-1.5 hover:shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
                <h3 className="text-2xl font-black tracking-tight text-slate-950">{feature.title}</h3>
                <p className="mt-6 text-base leading-8 text-slate-600">{feature.description}</p>
              </article>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2.2rem] border border-cyan-100 bg-[linear-gradient(135deg,rgba(240,249,255,0.96)_0%,rgba(236,254,255,0.94)_52%,rgba(255,255,255,0.98)_100%)] p-7 shadow-[0_22px_65px_rgba(34,211,238,0.08)] sm:p-9 lg:p-10">
        <div className="about-glow-drift absolute -right-8 top-0 h-32 w-32 rounded-full bg-cyan-200/35 blur-3xl" />
        <div className="about-glow-drift about-delay-2 absolute bottom-0 left-10 h-28 w-28 rounded-full bg-emerald-100/40 blur-3xl" />

        <div className="relative max-w-3xl">
          <div className="max-w-2xl">
            <p className="scroll-reveal text-xs font-black uppercase tracking-[0.3em] text-cyan-700">Ready to live more intentionally?</p>
            <h2 className="scroll-reveal about-delay-1 mt-4 max-w-xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Start building a calmer relationship with your money.
            </h2>
            <p className="scroll-reveal about-delay-2 mt-4 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Create a clearer budget flow today. No clutter, no guesswork, and more control over every peso as your goals become easier to reach.
            </p>

            <div className="scroll-reveal reveal-soft about-delay-3 mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('sinop:open-auth', { detail: 'register' }))}
                className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#22d3ee_0%,#67e8f9_100%)] px-6 py-3 text-sm font-bold tracking-[0.01em] text-slate-950 shadow-[0_18px_40px_rgba(34,211,238,0.2)] transition hover:-translate-y-0.5 sm:min-w-60"
              >
                Get Started for Free
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
