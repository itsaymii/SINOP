import { useEffect, useState } from 'react'

import { fetchDashboardSummary } from '../lib/finance'

function formatCurrency(value) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(amount)
}

function ComparisonBars({ items }) {
  const maxValue = Math.max(...items.map((item) => Number(item.value || 0)), 1)
  const colors = ['#22d3ee', '#0f172a', '#10b981']

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item, index) => (
        <article key={item.label} className="rounded-[1.8rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_16px_35px_rgba(15,23,42,0.05)]">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
          <div className="mt-5 flex h-40 items-end rounded-[1.4rem] bg-slate-50/90 p-4">
            <div
              className="w-full rounded-2xl transition-all duration-500"
              style={{
                height: `${Math.max((Number(item.value || 0) / maxValue) * 100, 12)}%`,
                background: `linear-gradient(180deg, ${colors[index % colors.length]} 0%, rgba(255,255,255,0.9) 180%)`,
              }}
            />
          </div>
          <p className="mt-4 text-2xl font-black text-slate-950">{formatCurrency(item.value)}</p>
        </article>
      ))}
    </div>
  )
}

function SpendingTrend({ items }) {
  const points = items.map((item) => Number(item.total || 0))
  const max = Math.max(...points, 1)
  const width = 640
  const height = 220
  const step = items.length > 1 ? width / (items.length - 1) : width
  const path = items
    .map((item, index) => {
      const x = index * step
      const y = height - (Number(item.total || 0) / max) * (height - 30)
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  return (
    <section className="rounded-4xl border border-slate-200/80 bg-white/92 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Spending trend</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Expense flow over time</h2>
        </div>
        <p className="max-w-lg text-sm leading-7 text-slate-500">Follow how your expenses are changing across the months you have already logged.</p>
      </div>

      {items.length ? (
        <>
          <svg viewBox={`0 0 ${width} ${height}`} className="mt-8 w-full overflow-visible">
            <defs>
              <linearGradient id="insightTrend" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>
            <path d={path} fill="none" stroke="url(#insightTrend)" strokeWidth="5" strokeLinecap="round" />
            {items.map((item, index) => {
              const x = index * step
              const y = height - (Number(item.total || 0) / max) * (height - 30)
              return <circle key={item.month} cx={x} cy={y} r="6" fill="#22d3ee" />
            })}
          </svg>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => (
              <div key={item.month} className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50/85 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.month}</p>
                <p className="mt-2 text-lg font-black text-slate-950">{formatCurrency(item.total)}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50/85 p-6 text-sm leading-7 text-slate-500">
          No expense trend yet. Start logging expenses to generate a monthly graph.
        </div>
      )}
    </section>
  )
}

function CategoryBreakdown({ items }) {
  const maxValue = Math.max(...items.map((item) => Number(item.total || 0)), 1)

  return (
    <section className="rounded-4xl border border-slate-200/80 bg-white/92 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Category breakdown</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Where your expenses go</h2>
      </div>

      {items.length ? (
        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <article key={item.category} className="rounded-3xl border border-slate-200/80 bg-slate-50/85 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color || '#22d3ee' }} />
                  <p className="text-sm font-bold text-slate-900">{item.category}</p>
                </div>
                <p className="text-sm font-black text-slate-950">{formatCurrency(item.total)}</p>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max((Number(item.total || 0) / maxValue) * 100, 8)}%`,
                    backgroundColor: item.color || '#22d3ee',
                  }}
                />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50/85 p-6 text-sm leading-7 text-slate-500">
          No category expense data yet. Add expense transactions with categories to populate this chart.
        </div>
      )}
    </section>
  )
}

export function InsightsPage({ authToken }) {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadInsights() {
      try {
        setLoading(true)
        const response = await fetchDashboardSummary(authToken)
        if (active) {
          setDashboard(response)
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadInsights()

    return () => {
      active = false
    }
  }, [authToken])

  if (loading) {
    return <section className="rounded-4xl border border-slate-200/80 bg-white/80 p-8 text-slate-600">Loading insights...</section>
  }

  if (error) {
    return <section className="rounded-4xl border border-rose-200 bg-rose-50 p-8 text-rose-700">{error}</section>
  }

  const analytics = dashboard?.analytics || { expenses_by_category: [], spending_over_time: [], monthly_comparison: [] }

  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-700">Insights</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Your finance graphs and trends</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
          This page turns your encoded transactions into visual summaries so you can track income, expenses, savings, and category movement faster.
        </p>
      </div>

      <ComparisonBars items={analytics.monthly_comparison} />
      <SpendingTrend items={analytics.spending_over_time} />
      <CategoryBreakdown items={analytics.expenses_by_category} />
    </section>
  )
}
