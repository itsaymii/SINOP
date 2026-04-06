import { useEffect, useMemo, useState } from 'react'

import {
  createTransaction,
  deleteTransaction,
  fetchAccounts,
  fetchCategories,
  fetchTransactions,
  updateTransaction,
} from '../lib/finance'

function formatCurrency(value) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(amount)
}

const emptyForm = {
  amount: '',
  category: '',
  account: '',
  transfer_account: '',
  transaction_type: 'expense',
  transaction_date: new Date().toISOString().slice(0, 10),
  notes: '',
}

const surfaceClass = 'rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(248,250,252,0.95)_100%)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur sm:p-8'
const inputClass = 'w-full rounded-[1.25rem] border border-slate-200/90 bg-white px-4 py-3.5 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition duration-200 placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400'
const selectClass = 'w-full appearance-none rounded-[1.25rem] border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfd_100%)] px-4 py-3.5 pr-12 text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.05)] outline-none transition duration-200 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400'

function SelectChevron() {
  return (
    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
        <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export function TransactionsPage({ authToken }) {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('-transaction_date')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const hasAccounts = accounts.length > 0
  const availableTransferAccounts = accounts.filter((account) => String(account.id) !== String(form.account))

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [transactionData, categoryData, accountData] = await Promise.all([
        fetchTransactions(authToken, {
          search,
          type: typeFilter === 'all' ? '' : typeFilter,
          category: categoryFilter === 'all' ? '' : categoryFilter,
          sort: sortOrder,
        }),
        fetchCategories(authToken),
        fetchAccounts(authToken),
      ])

      setTransactions(transactionData)
      setCategories(categoryData)
      setAccounts(accountData)

      if (!form.account && accountData[0]) {
        setForm((current) => ({ ...current, account: String(accountData[0].id) }))
      }
      if (!form.category && categoryData[0]) {
        setForm((current) => ({ ...current, category: String(categoryData[0].id) }))
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [authToken, search, typeFilter, categoryFilter, sortOrder])

  const filteredCategories = useMemo(() => {
    if (form.transaction_type === 'transfer') {
      return []
    }

    if (form.transaction_type === 'all') {
      return categories
    }

    return categories.filter((category) => category.category_type === form.transaction_type)
  }, [categories, form.transaction_type])

  function updateForm(field, value) {
    setForm((current) => {
      if (field === 'transaction_type') {
        return {
          ...current,
          transaction_type: value,
          category: value === 'transfer' ? '' : current.category,
          transfer_account: value === 'transfer' ? current.transfer_account : '',
        }
      }

      if (field === 'account') {
        return {
          ...current,
          account: value,
          transfer_account: current.transfer_account === value ? '' : current.transfer_account,
        }
      }

      return { ...current, [field]: value }
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const payload = {
      ...form,
      amount: form.amount,
      category: form.transaction_type === 'transfer' ? null : form.category || null,
      account: form.account,
      transfer_account: form.transaction_type === 'transfer' ? form.transfer_account || null : null,
    }

    try {
      if (editingId) {
        await updateTransaction(authToken, editingId, payload)
      } else {
        await createTransaction(authToken, payload)
      }

      setForm((current) => ({
        ...emptyForm,
        account: current.account,
        category: current.category,
        transfer_account: '',
      }))
      setEditingId(null)
      await loadData()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  function handleEdit(transaction) {
    setEditingId(transaction.id)
    setForm({
      amount: transaction.amount,
      category: transaction.category ? String(transaction.category) : '',
      account: String(transaction.account),
      transfer_account: transaction.transfer_account ? String(transaction.transfer_account) : '',
      transaction_type: transaction.transaction_type,
      transaction_date: transaction.transaction_date,
      notes: transaction.notes || '',
    })
  }

  async function handleDelete(id) {
    setError('')

    try {
      await deleteTransaction(authToken, id)
      await loadData()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <section className="space-y-10">
      <div className="rounded-[2.25rem] border border-cyan-100/80 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(240,249,255,0.9)_52%,rgba(248,250,252,0.96)_100%)] p-6 shadow-[0_22px_60px_rgba(14,116,144,0.08)] sm:p-8">
        <div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-700">Transactions</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Keep every entry clean and quick.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">Add income, expenses, or transfers manually and review them with faster filters.</p>
          </div>
        </div>
      </div>

      {!hasAccounts ? (
        <p className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Add at least one account in Settings before creating transactions.
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={handleSubmit} className={surfaceClass}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{editingId ? 'Edit transaction' : 'Add transaction'}</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{editingId ? 'Refine the selected entry' : 'Create a fresh record'}</h2>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">
              Manual entry
            </div>
          </div>
          <div className="mt-6 grid gap-5">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Amount</span>
              <input
                type="text"
                value={form.amount}
                onChange={(event) => updateForm('amount', event.target.value)}
                placeholder="PHP 1,250"
                disabled={!hasAccounts}
                className={inputClass}
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">Type</span>
                <div className="relative">
                  <select
                    value={form.transaction_type}
                    onChange={(event) => updateForm('transaction_type', event.target.value)}
                    disabled={!hasAccounts}
                    className={selectClass}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfer</option>
                  </select>
                  <SelectChevron />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">Date</span>
                <input
                  type="date"
                  value={form.transaction_date}
                  onChange={(event) => updateForm('transaction_date', event.target.value)}
                  disabled={!hasAccounts}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">Category</span>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={(event) => updateForm('category', event.target.value)}
                    disabled={!hasAccounts || form.transaction_type === 'transfer'}
                    className={selectClass}
                  >
                    <option value="">{form.transaction_type === 'transfer' ? 'Category not needed for transfer' : 'Select category'}</option>
                    {filteredCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <SelectChevron />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">{form.transaction_type === 'transfer' ? 'From account' : 'Account'}</span>
                <div className="relative">
                  <select
                    value={form.account}
                    onChange={(event) => updateForm('account', event.target.value)}
                    disabled={!hasAccounts}
                    className={selectClass}
                  >
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                  <SelectChevron />
                </div>
              </label>
            </div>

            {form.transaction_type === 'transfer' ? (
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">To account</span>
                <div className="relative">
                  <select
                    value={form.transfer_account}
                    onChange={(event) => updateForm('transfer_account', event.target.value)}
                    disabled={!hasAccounts}
                    className={selectClass}
                  >
                    <option value="">Select destination account</option>
                    {availableTransferAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                  <SelectChevron />
                </div>
              </label>
            ) : null}

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Notes</span>
              <textarea
                value={form.notes}
                onChange={(event) => updateForm('notes', event.target.value)}
                rows="4"
                disabled={!hasAccounts}
                className={`${inputClass} min-h-28 resize-y`}
              />
            </label>
          </div>

          {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="submit" disabled={!hasAccounts} className="inline-flex rounded-full bg-[linear-gradient(135deg,#22d3ee_0%,#67e8f9_100%)] px-6 py-3 text-sm font-bold tracking-[0.01em] text-slate-950 shadow-[0_16px_35px_rgba(34,211,238,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
              {editingId ? 'Update transaction' : 'Add transaction'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setForm((current) => ({ ...emptyForm, account: current.account, category: current.category, transfer_account: '' }))
                }}
                className="inline-flex rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold tracking-[0.01em] text-slate-700 transition hover:bg-slate-50"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>

        <div className={surfaceClass}>
          <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Browse entries</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Filter and review faster</h2>
            </div>
            <div className="inline-flex self-start rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Search tools
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1.35fr_0.9fr_0.9fr] xl:grid-cols-[1.5fr_1fr_1fr]">
            <label className="block space-y-2 md:col-span-3 xl:col-span-1">
              <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Search</span>
              <input
                type="text"
                placeholder="Search transactions"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Type</span>
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className={selectClass}
                >
                  <option value="all">All types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="transfer">Transfer</option>
                </select>
                <SelectChevron />
              </div>
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Category</span>
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className={selectClass}
                >
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <SelectChevron />
              </div>
            </label>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">Use filters to trim the list without leaving the page.</p>
            <label className="block w-full max-w-xs space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Sort</span>
              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  className={selectClass}
                >
                  <option value="-transaction_date">Latest first</option>
                  <option value="transaction_date">Oldest first</option>
                  <option value="-amount">Highest amount</option>
                  <option value="amount">Lowest amount</option>
                </select>
                <SelectChevron />
              </div>
            </label>
          </div>

          <div className="mt-6 space-y-3">
            {loading ? (
              <p className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">Loading transactions...</p>
            ) : transactions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-6">
                <p className="text-sm font-bold text-slate-900">No transactions yet</p>
                <p className="mt-2 text-sm leading-7 text-slate-500">Your entries will appear here after you manually add them.</p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <article key={transaction.id} className="rounded-[1.8rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.86)_100%)] p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_18px_38px_rgba(34,211,238,0.1)]">
                  <div className="flex flex-col gap-3 min-[560px]:flex-row min-[560px]:items-center min-[560px]:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-black text-slate-900">{transaction.transaction_type === 'transfer' ? 'Transfer' : transaction.category_name || 'Uncategorized'}</p>
                        <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.18em] ${transaction.transaction_type === 'income' ? 'bg-emerald-100 text-emerald-700' : transaction.transaction_type === 'transfer' ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-200 text-slate-600'}`}>
                          {transaction.transaction_type}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {transaction.notes || 'No notes'} · {transaction.account_name}
                        {transaction.transfer_account_name ? ` to ${transaction.transfer_account_name}` : ''} · {transaction.transaction_date}
                      </p>
                    </div>
                    <div className="flex w-full items-center gap-3 min-[560px]:w-auto min-[560px]:shrink-0 min-[560px]:flex-nowrap">
                      <p className={`rounded-full px-3 py-2 text-lg font-black ${transaction.transaction_type === 'income' ? 'bg-emerald-50 text-emerald-600' : transaction.transaction_type === 'transfer' ? 'bg-cyan-50 text-cyan-700' : 'bg-slate-100 text-slate-900'}`}>
                        {transaction.transaction_type === 'expense' ? '-' : transaction.transaction_type === 'income' ? '+' : ''}{formatCurrency(transaction.amount)}
                      </p>
                      <button type="button" onClick={() => handleEdit(transaction)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(transaction.id)} className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-50">
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
