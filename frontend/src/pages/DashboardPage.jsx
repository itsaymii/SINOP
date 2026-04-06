import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { ACCOUNT_TYPE_OPTIONS, formatAccountTypeLabel, getSignedAccountBalance, isLiabilityAccountType } from '../lib/accountTypes'
import { createAccount, fetchDashboardSummary } from '../lib/finance'

const initialAccountForm = {
  name: '',
  account_type: 'wallet',
  balance: '',
  currency: 'PHP',
}

function formatCurrency(value) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function DashboardPage({ authToken }) {
  const [dashboard, setDashboard] = useState(null)
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [accountForm, setAccountForm] = useState(initialAccountForm)
  const [accountError, setAccountError] = useState('')
  const [accountSuccess, setAccountSuccess] = useState('')
  const [isSavingAccount, setIsSavingAccount] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
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

    loadDashboard()

    return () => {
      active = false
    }
  }, [authToken])

  async function handleAccountCreate(event) {
    event.preventDefault()
    setAccountError('')
    setAccountSuccess('')

    try {
      setIsSavingAccount(true)
      await createAccount(authToken, {
        ...accountForm,
        balance: accountForm.balance || '0',
      })

      const response = await fetchDashboardSummary(authToken)
      setDashboard(response)
      setAccountForm(initialAccountForm)
      setShowAccountForm(false)
      setAccountSuccess('Account added. Your total balance has been updated.')
    } catch (requestError) {
      setAccountError(requestError.message)
    } finally {
      setIsSavingAccount(false)
    }
  }

  if (loading) {
    return <section className="rounded-4xl border border-slate-200/80 bg-white/80 p-8 text-slate-600">Loading dashboard...</section>
  }

  if (error) {
    return <section className="rounded-4xl border border-rose-200 bg-rose-50 p-8 text-rose-700">{error}</section>
  }

  const summary = dashboard?.summary || {}
  const accounts = dashboard?.accounts || []
  const transactions = dashboard?.transactions || []
  const liabilityAccounts = accounts.filter((account) => isLiabilityAccountType(account.account_type))
  const assetAccounts = accounts.length - liabilityAccounts.length
  const selectedAccountIsLiability = isLiabilityAccountType(accountForm.account_type)

  return (
    <section className="p-1 sm:p-2">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-700">Current balance</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-[4.25rem]">{formatCurrency(summary.total_balance)}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setShowAccountForm((current) => !current)
              setAccountError('')
              setAccountSuccess('')
            }}
            className="inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5"
          >
            {showAccountForm ? 'Close add account' : 'Add account'}
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="group rounded-[1.7rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,245,249,0.9)_100%)] p-5 shadow-[0_14px_35px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_22px_50px_rgba(34,211,238,0.14)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Total accounts</p>
            <span className="h-2.5 w-2.5 rounded-full bg-slate-950 transition duration-300 group-hover:scale-125" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-950">{accounts.length}</p>
          <p className="mt-2 text-sm text-slate-500">All active money containers you added.</p>
        </article>
        <article className="group rounded-[1.7rem] border border-emerald-200/80 bg-[linear-gradient(180deg,rgba(236,253,245,0.96)_0%,rgba(255,255,255,0.94)_100%)] p-5 shadow-[0_14px_35px_rgba(16,185,129,0.08)] transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_22px_50px_rgba(16,185,129,0.16)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-700">Asset accounts</p>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 transition duration-300 group-hover:scale-125" />
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-700">{assetAccounts}</p>
          <p className="mt-2 text-sm text-emerald-800/70">Accounts that add to your total balance.</p>
        </article>
        <article className="group rounded-[1.7rem] border border-rose-200/80 bg-[linear-gradient(180deg,rgba(255,241,242,0.96)_0%,rgba(255,255,255,0.94)_100%)] p-5 shadow-[0_14px_35px_rgba(244,63,94,0.08)] transition duration-300 hover:-translate-y-1 hover:border-rose-300 hover:shadow-[0_22px_50px_rgba(244,63,94,0.16)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.22em] text-rose-600">Liability accounts</p>
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 transition duration-300 group-hover:scale-125" />
          </div>
          <p className="mt-3 text-3xl font-black text-rose-600">{liabilityAccounts.length}</p>
          <p className="mt-2 text-sm text-rose-900/60">Accounts that reduce your net balance.</p>
        </article>
      </div>

      {accountSuccess ? <p className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">{accountSuccess}</p> : null}

      {showAccountForm ? (
        <form onSubmit={handleAccountCreate} className="mt-6 rounded-4xl border border-slate-200/80 bg-white/92 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:p-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Add account</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Enter the current balance for each account</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-500">Choose a category, enter the account name, then add the current balance. For credit or loans, enter the amount you still owe.</p>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Category</span>
              <select
                value={accountForm.account_type}
                onChange={(event) => setAccountForm((current) => ({ ...current, account_type: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-300"
              >
                {ACCOUNT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Wallet / account name</span>
              <input
                type="text"
                value={accountForm.name}
                onChange={(event) => setAccountForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="GCash, Emergency Fund, Credit Card"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-300"
              />
            </label>

            <label className="block space-y-2 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-800">{selectedAccountIsLiability ? 'Amount owed' : 'Current money'}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{accountForm.currency}</span>
              </div>
              <input
                type="text"
                value={accountForm.balance}
                onChange={(event) => setAccountForm((current) => ({ ...current, balance: event.target.value }))}
                placeholder={selectedAccountIsLiability ? '12000' : '5000'}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-300"
              />
              <p className="text-xs leading-6 text-slate-500">{selectedAccountIsLiability ? 'For liabilities, enter the remaining amount to pay.' : 'For wallets and savings, enter the amount currently available.'}</p>
            </label>
          </div>

          {accountError ? <p className="mt-4 text-sm text-rose-600">{accountError}</p> : null}

          <div className="mt-6 flex flex-col gap-4 border-t border-slate-200/80 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">This account will appear as a separate card on your dashboard after saving.</p>
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={isSavingAccount} className="inline-flex rounded-full bg-[linear-gradient(135deg,#22d3ee_0%,#67e8f9_100%)] px-6 py-3 text-sm font-bold tracking-[0.01em] text-slate-950 shadow-[0_16px_35px_rgba(34,211,238,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
                {isSavingAccount ? 'Saving account...' : 'Save account'}
              </button>
              <button type="button" onClick={() => setAccountForm(initialAccountForm)} className="inline-flex rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                Reset
              </button>
            </div>
          </div>
        </form>
      ) : null}

      <div className="mt-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Your accounts</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Each account gets its own card</h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.length ? (
            accounts.map((account) => (
              <article
                key={account.id}
                className="group rounded-[1.8rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.92)_100%)] p-5 shadow-[0_18px_38px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_24px_55px_rgba(34,211,238,0.14)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{formatAccountTypeLabel(account.account_type)}</p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">{account.name}</h3>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${isLiabilityAccountType(account.account_type) ? 'bg-rose-100 text-rose-700' : 'bg-cyan-100 text-cyan-800'}`}>
                    {isLiabilityAccountType(account.account_type) ? 'Liability' : 'Asset'}
                  </span>
                </div>

                <div className="mt-8 rounded-[1.4rem] border border-slate-200/80 bg-white/90 p-4 transition duration-300 group-hover:border-cyan-200/80">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Balance</p>
                  <p className={`mt-3 text-3xl font-black ${isLiabilityAccountType(account.account_type) ? 'text-rose-600' : 'text-slate-950'}`}>
                    {formatCurrency(getSignedAccountBalance(account))}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{account.currency || 'PHP'}</p>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-slate-50/80 p-6 text-sm leading-7 text-slate-500 md:col-span-2 xl:col-span-3">
              No account cards yet. Add a wallet, savings, credit, or loan account to show it here.
            </div>
          )}
        </div>
      </div>

      <div className="mt-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Transactions</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Recent transaction list</h2>
          </div>
          <Link to="/transactions" className="text-sm font-bold text-cyan-700 transition hover:text-cyan-900">
            Open all transactions
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {transactions.length ? (
            transactions.slice(0, 8).map((transaction) => (
              <article
                key={transaction.id}
                className="rounded-[1.6rem] border border-slate-200/80 bg-white/92 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition duration-300 hover:border-cyan-200 hover:shadow-[0_18px_40px_rgba(34,211,238,0.12)]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      {transaction.transaction_type === 'transfer' ? 'Transfer' : transaction.category_name || 'Uncategorized'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {transaction.account_name}
                      {transaction.transfer_account_name ? ` to ${transaction.transfer_account_name}` : ''}
                      {transaction.notes ? ` · ${transaction.notes}` : ''}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className={`text-lg font-black ${transaction.transaction_type === 'income' ? 'text-emerald-600' : transaction.transaction_type === 'transfer' ? 'text-cyan-700' : 'text-slate-950'}`}>
                      {transaction.transaction_type === 'expense' ? '-' : transaction.transaction_type === 'income' ? '+' : ''}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{transaction.transaction_date}</p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-slate-50/80 p-6 text-sm leading-7 text-slate-500">
              No transactions yet. Add your first expense, income, or transfer to show it here.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
