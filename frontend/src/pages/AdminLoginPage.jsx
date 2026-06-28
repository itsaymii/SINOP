import { useState } from 'react'

export function AdminLoginPage({ onAdminLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await onAdminLogin({ email, password })
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in. Please check your credentials.')
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <article className="rounded-4xl border border-cyan-100 bg-white/95 p-8 shadow-[0_22px_70px_rgba(15,23,42,0.06)] lg:pr-10">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-700">Admin access</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Dashboard login</h1>
        <p className="mt-5 text-base leading-8 text-slate-600">
          Use your admin credentials only on this page. The admin dashboard is separate from regular user authentication.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-cyan-50 p-5 ring-1 ring-cyan-100">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-700">Private access</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">Only staff users can sign in through this admin portal.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-100">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Secure entry</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">This page is designed exclusively for the backend administration interface.</p>
          </div>
        </div>
      </article>

      <form onSubmit={handleSubmit} className="rounded-4xl border border-slate-200 bg-white/95 p-8 text-slate-900 shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Admin dashboard login</p>
            <p className="mt-1 text-sm text-slate-600">Only use the credentials assigned for the admin portal.</p>
          </div>
          <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Admin</span>
        </div>

        {error ? <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <div className="space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">Admin email</span>
            <input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:bg-cyan-50/50"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">Password</span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-20 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:bg-cyan-50/50"
                required
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
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#22d3ee_0%,#67e8f9_100%)] px-6 py-3 text-sm font-bold tracking-[0.01em] text-slate-950 shadow-[0_16px_35px_rgba(34,211,238,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </section>
  )
}
