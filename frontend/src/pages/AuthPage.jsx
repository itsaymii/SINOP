import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export function AuthPage({ mode, onAuthenticate }) {
  const isLogin = mode === 'login'
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()

    onAuthenticate({
      email,
      fullName: fullName || 'Sinop User',
      password,
    })

    navigate('/dashboard')
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <article className="rounded-4xl border border-cyan-100 bg-white/85 p-8 shadow-[0_22px_70px_rgba(15,23,42,0.06)] lg:pr-10">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-700">
          {isLogin ? 'Welcome back' : 'Create your account'}
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
          {isLogin ? 'Log in to Sinop.' : 'Register for Sinop.'}
        </h1>
        <p className="mt-5 text-base leading-8 text-slate-600">
          {isLogin
            ? 'Access your budgets, expense categories, and recent summaries.'
            : 'Start organizing your money with a cleaner system for tracking daily spending and savings goals.'}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-cyan-50 p-5 ring-1 ring-cyan-100">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-700">Secure access</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">A clean auth surface that matches the rest of the product language.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-100">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Money-ready</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Designed to lead into future flows like balance setup, goals, and spending categories.
            </p>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm leading-7 text-slate-600">
            This is a UI starter for authentication pages. The next step is wiring these forms to Django auth endpoints.
          </p>
        </div>
      </article>

      <form
        onSubmit={handleSubmit}
        className="rounded-4xl border border-slate-200 bg-white/85 p-8 text-slate-900 shadow-[0_22px_70px_rgba(15,23,42,0.06)]"
      >
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Sinop access</p>
            <p className="mt-1 text-sm text-slate-600">Finance-focused onboarding with a precise, distraction-free visual tone.</p>
          </div>
          <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
            {isLogin ? 'Login' : 'Register'}
          </span>
        </div>

        <div className="space-y-5">
          {!isLogin && (
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Full name</span>
              <input
                type="text"
                placeholder="Juan Dela Cruz"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:bg-cyan-50/50"
              />
            </label>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:bg-cyan-50/50"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">Password</span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="........"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-20 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:bg-cyan-50/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((currentValue) => !currentValue)}
                className="absolute inset-y-0 right-3 my-auto inline-flex h-9 items-center justify-center rounded-full px-3 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700 transition hover:bg-cyan-50"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {!isLogin && (
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Monthly budget goal</span>
              <input
                type="text"
                placeholder="PHP 25,000"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:bg-cyan-50/50"
              />
            </label>
          )}
        </div>

        <button
          type="submit"
          className="mt-7 inline-flex rounded-full bg-[linear-gradient(135deg,#22d3ee_0%,#67e8f9_100%)] px-6 py-3 text-sm font-bold tracking-[0.01em] text-slate-950 shadow-[0_16px_35px_rgba(34,211,238,0.18)] transition hover:-translate-y-0.5"
        >
          {isLogin ? 'Log in' : 'Create account'}
        </button>

        <p className="mt-4 text-center text-sm text-slate-500">
          {isLogin ? 'Need an account?' : 'Already registered?'}{' '}
          <Link to={isLogin ? '/register' : '/login'} className="font-bold text-cyan-700">
            {isLogin ? 'Register here' : 'Log in here'}
          </Link>
        </p>
      </form>
    </section>
  )
}
