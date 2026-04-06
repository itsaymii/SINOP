import { useEffect, useState } from 'react'

import {
  createAccount,
  createCategory,
  fetchAccounts,
  fetchCategories,
  fetchSettings,
  updateSettings,
} from '../lib/finance'
import { ACCOUNT_TYPE_OPTIONS, formatAccountTypeLabel, getSignedAccountBalance, isLiabilityAccountType } from '../lib/accountTypes'

const initialCategoryForm = {
  name: '',
  category_type: 'expense',
  color: '#22d3ee',
  icon: 'wallet',
}

const initialAccountForm = {
  name: '',
  account_type: 'wallet',
  balance: '0',
  institution: '',
  currency: 'PHP',
}

export function SettingsPage({ authToken, currentUser, onUpdateProfile }) {
  const [settings, setSettings] = useState(null)
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [profileName, setProfileName] = useState(currentUser?.full_name || '')
  const [profileGoal, setProfileGoal] = useState(currentUser?.monthly_budget_goal || '')
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm)
  const [accountForm, setAccountForm] = useState(initialAccountForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadData() {
    try {
      const [settingsData, categoryData, accountData] = await Promise.all([
        fetchSettings(authToken),
        fetchCategories(authToken),
        fetchAccounts(authToken),
      ])
      setSettings(settingsData.settings)
      setCategories(categoryData)
      setAccounts(accountData)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  useEffect(() => {
    loadData()
  }, [authToken])

  useEffect(() => {
    setProfileName(currentUser?.full_name || '')
    setProfileGoal(currentUser?.monthly_budget_goal || '')
  }, [currentUser])

  async function handleProfileSave(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      await onUpdateProfile({ fullName: profileName, monthlyBudgetGoal: profileGoal })
      setSuccess('Profile settings updated.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function handlePreferenceSave(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await updateSettings(authToken, settings)
      setSettings(response.settings)
      setSuccess('App settings updated.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function handleCategoryCreate(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      await createCategory(authToken, categoryForm)
      setCategoryForm(initialCategoryForm)
      await loadData()
      setSuccess('Category created.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function handleAccountCreate(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      await createAccount(authToken, accountForm)
      setAccountForm(initialAccountForm)
      await loadData()
      setSuccess('Account created.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <section className="space-y-10">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-700">Settings</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Control your profile, preferences, categories, and accounts.</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
          Set up your finance workspace manually here. Create the accounts and categories you actually use, then start encoding transactions from scratch.
        </p>
      </div>

      {error ? <p className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">{success}</p> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={handleProfileSave} className="rounded-4xl border border-slate-200/80 bg-white/88 p-6 shadow-[0_15px_45px_rgba(15,23,42,0.05)] sm:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Profile</p>
          <div className="mt-6 grid gap-5">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Full name</span>
              <input
                type="text"
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-300"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Monthly budget goal</span>
              <input
                type="text"
                value={profileGoal}
                onChange={(event) => setProfileGoal(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-300"
              />
            </label>
          </div>
          <button type="submit" className="mt-6 inline-flex rounded-full bg-[linear-gradient(135deg,#22d3ee_0%,#67e8f9_100%)] px-6 py-3 text-sm font-bold tracking-[0.01em] text-slate-950 shadow-[0_16px_35px_rgba(34,211,238,0.18)] transition hover:-translate-y-0.5">
            Save profile
          </button>
        </form>

        <form onSubmit={handlePreferenceSave} className="rounded-4xl border border-slate-200/80 bg-white/88 p-6 shadow-[0_15px_45px_rgba(15,23,42,0.05)] sm:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">App preferences</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Currency</span>
              <select
                value={settings?.currency || 'PHP'}
                onChange={(event) => setSettings((current) => ({ ...current, currency: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-300"
              >
                <option value="PHP">PHP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Locale</span>
              <input
                type="text"
                value={settings?.locale || 'en-PH'}
                onChange={(event) => setSettings((current) => ({ ...current, locale: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-300"
              />
            </label>
          </div>
          <div className="mt-5 space-y-4">
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <span className="text-sm font-semibold text-slate-800">Dark mode</span>
              <input
                type="checkbox"
                checked={Boolean(settings?.dark_mode)}
                onChange={(event) => setSettings((current) => ({ ...current, dark_mode: event.target.checked }))}
              />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <span className="text-sm font-semibold text-slate-800">Two-factor authentication</span>
              <input
                type="checkbox"
                checked={Boolean(settings?.two_factor_enabled)}
                onChange={(event) => setSettings((current) => ({ ...current, two_factor_enabled: event.target.checked }))}
              />
            </label>
          </div>
          <button type="submit" className="mt-6 inline-flex rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
            Save preferences
          </button>
        </form>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={handleCategoryCreate} className="rounded-4xl border border-slate-200/80 bg-white/88 p-6 shadow-[0_15px_45px_rgba(15,23,42,0.05)] sm:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Category management</p>
          <div className="mt-6 grid gap-5">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Category name</span>
              <input type="text" value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-300" />
            </label>
            <div className="grid gap-5 sm:grid-cols-3">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">Type</span>
                <select value={categoryForm.category_type} onChange={(event) => setCategoryForm((current) => ({ ...current, category_type: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-300">
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">Color</span>
                <input type="color" value={categoryForm.color} onChange={(event) => setCategoryForm((current) => ({ ...current, color: event.target.value }))} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-2 py-2" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">Icon</span>
                <input type="text" value={categoryForm.icon} onChange={(event) => setCategoryForm((current) => ({ ...current, icon: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-300" />
              </label>
            </div>
          </div>
          <button type="submit" className="mt-6 inline-flex rounded-full bg-[linear-gradient(135deg,#22d3ee_0%,#67e8f9_100%)] px-6 py-3 text-sm font-bold tracking-[0.01em] text-slate-950 shadow-[0_16px_35px_rgba(34,211,238,0.18)] transition hover:-translate-y-0.5">
            Add category
          </button>
          <div className="mt-6 flex flex-wrap gap-3">
            {categories.length ? (
              categories.map((category) => (
                <span key={category.id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                  {category.name}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-500">No categories yet. Add only the ones you really need.</p>
            )}
          </div>
        </form>

        <form onSubmit={handleAccountCreate} className="rounded-4xl border border-slate-200/80 bg-white/88 p-6 shadow-[0_15px_45px_rgba(15,23,42,0.05)] sm:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Multiple accounts</p>
          <div className="mt-6 grid gap-5">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Wallet / account name</span>
              <input type="text" value={accountForm.name} onChange={(event) => setAccountForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-300" />
            </label>
            <div className="grid gap-5 sm:grid-cols-3">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">Category</span>
                <select value={accountForm.account_type} onChange={(event) => setAccountForm((current) => ({ ...current, account_type: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-300">
                  {ACCOUNT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">Current money</span>
                <input type="text" value={accountForm.balance} onChange={(event) => setAccountForm((current) => ({ ...current, balance: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-300" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">Institution</span>
                <input type="text" value={accountForm.institution} onChange={(event) => setAccountForm((current) => ({ ...current, institution: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-300" />
              </label>
            </div>
            <p className="text-sm leading-7 text-slate-500">For credit and loans, enter the amount you still owe so the dashboard can subtract it from your total balance.</p>
          </div>
          <button type="submit" className="mt-6 inline-flex rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
            Add account
          </button>
          <div className="mt-6 space-y-3">
            {accounts.length ? (
              accounts.map((account) => (
                <article key={account.id} className="rounded-3xl border border-slate-200/70 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{account.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{formatAccountTypeLabel(account.account_type)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isLiabilityAccountType(account.account_type) ? 'text-rose-600' : 'text-slate-700'}`}>{getSignedAccountBalance(account)} {account.currency}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{isLiabilityAccountType(account.account_type) ? 'Liability' : 'Asset'}</p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-500">No accounts yet. Add your first wallet, savings, credit, or loan account here.</p>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}
