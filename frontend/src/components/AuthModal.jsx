import { useEffect, useState } from 'react'

export function AuthModal({ mode, onAuthenticate, onClose, onSwitchMode, successMessage, initialEmail }) {
  const isLogin = mode === 'login'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [monthlyBudgetGoal, setMonthlyBudgetGoal] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    setFullName('')
    setEmail(initialEmail || '')
    setPassword('')
    setShowPassword(false)
    setMonthlyBudgetGoal('')
    setError('')
    setIsSubmitting(false)
  }, [initialEmail, mode])

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setIsSubmitting(true)

    try {
      await onAuthenticate({
        mode,
        email,
        fullName: fullName || 'Sinop User',
        password,
        monthlyBudgetGoal,
      })
    } catch (requestError) {
      setError(requestError.message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close authentication modal"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/25 backdrop-blur-md"
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md rounded-[1.8rem] border border-slate-200/80 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.2)] sm:p-7"
      >
          <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-700">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {isLogin ? 'Log in to Sinop.' : 'Register for Sinop.'}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {isLogin
                  ? 'Access your budget dashboard in one simple step.'
                  : 'Create your account and start tracking with clarity.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            >
              <span className="sr-only">Close</span>
              <span className="text-lg leading-none">×</span>
            </button>
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
                  value={monthlyBudgetGoal}
                  onChange={(event) => setMonthlyBudgetGoal(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:bg-cyan-50/50"
                />
              </label>
            )}
          </div>

          {successMessage ? <p className="mt-4 text-sm text-emerald-600">{successMessage}</p> : null}
          {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

          <button
            type="submit"
              disabled={isSubmitting}
            className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#22d3ee_0%,#67e8f9_100%)] px-6 py-3.5 text-sm font-bold tracking-[0.01em] text-slate-950 shadow-[0_18px_40px_rgba(34,211,238,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_45px_rgba(34,211,238,0.24)]"
          >
              {isSubmitting ? 'Please wait...' : isLogin ? 'Log in to continue' : 'Create account'}
          </button>

          <p className="mt-4 text-center text-sm text-slate-500">
            {isLogin ? 'Need an account?' : 'Already registered?'}{' '}
            <button type="button" onClick={onSwitchMode} className="font-bold text-cyan-700">
              {isLogin ? 'Register here' : 'Log in here'}
            </button>
          </p>
      </form>
    </div>
  )
}