import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  Users,
  Wallet,
  Tag,
  TrendingUp,
  LineChart,
  MessageSquare,
  Settings,
  ShieldAlert,
  Bell,
  LogOut,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Calendar,
  Filter,
  Menu,
  X,
  ChevronRight,
  Activity,
  CreditCard,
  PieChart,
  Lock,
  Mail,
  CheckCircle2,
  AlertTriangle,
  MoreHorizontal,
  Download,
  Send,
  Plus,
} from 'lucide-react'
import { fetchAdminDashboardSummary, createNotification, updateSettings, createCategory, updateCategory, deleteCategory } from '../lib/finance'
import { registerAccount, updateProfile } from '../lib/auth'

function formatCurrency(value) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-PH', {
    maximumFractionDigits: 0,
  }).format(value || 0)
}

const menuItems = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'transactions', label: 'Transactions', icon: Wallet },
  { key: 'categories', label: 'Categories', icon: Tag },
  { key: 'budgets', label: 'Budgets', icon: TrendingUp },
  { key: 'reports', label: 'Reports', icon: LineChart },
  { key: 'feedback', label: 'Feedback', icon: MessageSquare },
  { key: 'logs', label: 'Security Logs', icon: ShieldAlert },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'settings', label: 'Settings', icon: Settings },
]

const placeholderLogs = [
  { title: 'Admin login successful', user: 'admin@system.local', time: 'Today, 9:00 AM', status: 'success' },
  { title: 'Settings updated', user: 'admin@system.local', time: 'Today, 8:30 AM', status: 'success' },
  { title: 'Failed login attempt', user: 'unknown_user', time: 'Yesterday, 7:42 PM', status: 'failed' },
]

export function AdminDashboardPage({ authToken, currentUser, onLogout }) {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState('overview')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const refreshDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAdminDashboardSummary(authToken)
      setDashboard(data)
      setError('')
    } catch (err) {
      setError('Failed to load admin dashboard')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [authToken])

  useEffect(() => {
    refreshDashboard()
  }, [refreshDashboard])

  const summary = dashboard?.summary || {
    total_users: 0,
    active_users: 0,
    total_accounts: 0,
    total_budgets: 0,
    total_transactions: 0,
    monthly_income: 0,
    monthly_expenses: 0,
    monthly_savings: 0,
    server_online: true,
  }

  const users = Array.isArray(dashboard?.recent_users) ? dashboard.recent_users : []
  const transactions = Array.isArray(dashboard?.transactions) ? dashboard.transactions : []
  const categories = Array.isArray(dashboard?.categories) ? dashboard.categories : []
  const budgets = Array.isArray(dashboard?.budgets) ? dashboard.budgets : []
  const feedback = Array.isArray(dashboard?.feedback) ? dashboard.feedback : []
  const logs = Array.isArray(dashboard?.logs) ? dashboard.logs : []
  const notifications = Array.isArray(dashboard?.notifications) ? dashboard.notifications : []

  const activePage = useMemo(() => {
    return menuItems.find((item) => item.key === activeSection) || menuItems[0]
  }, [activeSection])

  if (!currentUser?.is_staff) {
    return <AccessDenied />
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (error) {
    return <ErrorScreen error={error} />
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />

        <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
          <Topbar
            activePage={activePage}
            currentUser={currentUser}
            setMobileSidebarOpen={setMobileSidebarOpen}
            onLogout={onLogout}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
              {activeSection === 'overview' && <OverviewSection summary={summary} users={users} logs={logs} onViewDetails={() => setActiveSection('reports')} />}
            {activeSection === 'users' && (
              <UserManagementSection
                users={users}
                authToken={authToken}
                onRefresh={refreshDashboard}
              />
            )}
            {activeSection === 'transactions' && <TransactionMonitoringSection transactions={transactions} />}
            {activeSection === 'categories' && (
              <CategoryManagementSection
                categories={categories}
                authToken={authToken}
                onRefresh={refreshDashboard}
              />
            )}
            {activeSection === 'budgets' && <BudgetManagementSection budgets={budgets} />}
            {activeSection === 'reports' && <ReportsSection summary={summary} transactions={transactions} />}
            {activeSection === 'feedback' && <FeedbackSection feedback={feedback} />}
            {activeSection === 'logs' && <SecurityLogsSection logs={logs} />}
            {activeSection === 'notifications' && (
              <NotificationsSection
                notifications={notifications}
                authToken={authToken}
                onRefresh={refreshDashboard}
              />
            )}
            {activeSection === 'settings' && (
              <SettingsSection
                currentUser={currentUser}
                authToken={authToken}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

function Sidebar({ activeSection, setActiveSection, mobileSidebarOpen, setMobileSidebarOpen }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition lg:hidden ${
          mobileSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-72 transform p-4 transition lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col rounded-[2rem] border border-slate-800 bg-slate-950 p-4 text-white shadow-2xl">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight">Money Admin</h1>
                <p className="text-xs text-slate-400">Finance Control Panel</p>
              </div>
            </div>

            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.key

              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveSection(item.key)
                    setMobileSidebarOpen(false)
                  }}
                  className={`group flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-white text-slate-950 shadow-lg'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-white'}`} />
                    {item.label}
                  </span>
                  {isActive && <ChevronRight className="h-4 w-4 text-slate-400" />}
                </button>
              )
            })}
          </nav>

          <div className="mt-auto rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold">
              <ShieldAlert className="h-4 w-4 text-blue-400" />
              System Status
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Admin dashboard is online and ready for monitoring users, budgets, and transactions.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}

function Topbar({ activePage, currentUser, setMobileSidebarOpen, onLogout }) {
  const Icon = activePage.icon

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-100/80 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm sm:flex">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-lg font-black tracking-tight text-slate-950 sm:text-xl">
              {activePage.label}
            </h2>
            <p className="truncate text-xs font-medium text-slate-500">
              Manage and monitor your money tracker platform.
            </p>
          </div>
        </div>

        <div className="hidden max-w-md flex-1 items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm xl:flex">
          <Search className="mr-3 h-4 w-4 text-slate-400" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            placeholder="Search users, transactions, reports..."
          />
        </div>

        <div className="flex items-center gap-2">
          <button className="relative rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 shadow-sm hover:text-blue-600">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-blue-600" />
          </button>

          <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">
              {(currentUser?.full_name || currentUser?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="max-w-40">
              <p className="truncate text-sm font-bold text-slate-900">
                {currentUser?.full_name || 'Admin User'}
              </p>
              <p className="truncate text-xs text-slate-500">{currentUser?.email}</p>
            </div>
          </div>

          <button onClick={onLogout} className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 shadow-sm hover:text-red-600">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

function OverviewSection({ summary, users, logs, onViewDetails }) {
  const cards = [
    {
      label: 'Total Users',
      value: formatNumber(summary.total_users),
      change: '+12.4%',
      icon: Users,
      tone: 'blue',
    },
    {
      label: 'Active Users',
      value: formatNumber(summary.active_users),
      change: '+8.2%',
      icon: Activity,
      tone: 'emerald',
    },
    {
      label: 'Total Accounts',
      value: formatNumber(summary.total_accounts),
      change: '+5.7%',
      icon: Wallet,
      tone: 'orange',
    },
    {
      label: 'Transactions',
      value: formatNumber(summary.total_transactions),
      change: '+18.9%',
      icon: Wallet,
      tone: 'violet',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHero
        title="Dashboard Overview"
        description="Monitor users, transactions, budgets, reports, and system activity in one place."
        icon={BarChart3}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-950">Monthly Activity</h3>
              <p className="text-xs text-slate-500">Sample growth visualization</p>
            </div>
            <button onClick={onViewDetails} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
              View Details
            </button>
          </div>

          <div className="flex h-72 items-end gap-3">
            {[40, 62, 48, 78, 56, 90, 72, 88, 66, 94, 80, 100].map((height, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-2xl bg-blue-600/90" style={{ height: `${height}%` }} />
                <span className="text-[10px] font-bold text-slate-400">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black">System Health</h3>
              <p className="text-xs text-slate-400">Current platform status</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>

          <div className="space-y-4">
            <HealthItem label="Server Status" value="Online" />
            <HealthItem label="Database" value="Connected" />
            <HealthItem label="API Response" value="Stable" />
            <HealthItem label="Security Layer" value="Protected" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <RecentUsers users={users} />
        <ActivityFeed logs={logs} />
      </div>
    </div>
  )
}

function UserManagementSection({ users, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newFullName, setNewFullName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [createStatus, setCreateStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const filteredUsers = users.filter((user) => {
    const name = (user.full_name || '').toLowerCase()
    const email = (user.email || '').toLowerCase()
    const query = searchTerm.toLowerCase()
    return name.includes(query) || email.includes(query)
  })

  const handleCreateUser = async (event) => {
    event.preventDefault()
    if (!newFullName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setCreateStatus({ type: 'error', text: 'All fields are required to create a new user.' })
      return
    }

    setSubmitting(true)
    setCreateStatus(null)

    try {
      await registerAccount({
        fullName: newFullName,
        email: newEmail,
        password: newPassword,
      })
      setCreateStatus({ type: 'success', text: 'New user created successfully.' })
      setNewFullName('')
      setNewEmail('')
      setNewPassword('')
      setShowCreateForm(false)
      if (typeof onRefresh === 'function') {
        onRefresh()
      }
    } catch (err) {
      setCreateStatus({ type: 'error', text: err.message || 'Unable to create user.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="User Management"
        description="Manage registered users, status, permissions, and account information."
        icon={Users}
      />

      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-md flex-1 items-center rounded-2xl border border-slate-200 px-4 py-3">
            <Search className="mr-3 h-4 w-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              placeholder="Search users..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateForm((open) => !open)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4" />
              {showCreateForm ? 'Cancel' : 'Add User'}
            </button>
            {showCreateForm && (
              <button
                onClick={handleCreateUser}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Create
              </button>
            )}
          </div>
        </div>

        {showCreateForm && (
          <div className="rounded-b-[2rem] border-t border-slate-200 bg-slate-50 p-5">
            <form onSubmit={handleCreateUser} className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Full Name</label>
                <input
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Email</label>
                <input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  type="email"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Password</label>
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type="password"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600"
                  placeholder="Password"
                />
              </div>
              {createStatus && (
                <div className={`md:col-span-3 rounded-2xl px-4 py-3 text-sm font-medium ${createStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {createStatus.text}
                </div>
              )}
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Date Joined</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredUsers.slice(0, 10).map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                        {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-950">{user.full_name || 'Unnamed User'}</p>
                        <p className="text-xs text-slate-500">Standard User</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{user.email}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge label="Active" type="success" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-950">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-sm font-medium text-slate-400">
                    {users.length === 0 ? 'No users found.' : 'No matching users.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function TransactionMonitoringSection({ transactions = [] }) {
  const [filteredTransactions, setFilteredTransactions] = useState(transactions)
  const [typeFilter, setTypeFilter] = useState('All Transactions')

  useEffect(() => {
    setFilteredTransactions(transactions)
  }, [transactions])
  
  // Calculate totals
  const totalIncome = transactions
    .filter(tx => tx.type === 'Income')
    .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0)
  
  const totalExpense = transactions
    .filter(tx => tx.type === 'Expense')
    .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0)
  
  const netBalance = totalIncome - totalExpense
  
  // Handle filter change
  const handleFilterChange = (e) => {
    const value = e.target.value
    setTypeFilter(value)
    if (value === 'All Transactions') {
      setFilteredTransactions(transactions)
    } else if (value === 'Income') {
      setFilteredTransactions(transactions.filter(tx => tx.type === 'Income'))
    } else if (value === 'Expense') {
      setFilteredTransactions(transactions.filter(tx => tx.type === 'Expense'))
    }
  }

  const handleExport = () => {
    if (filteredTransactions.length === 0) {
      return
    }

    const rows = filteredTransactions.map((tx) => [
      tx.user,
      tx.type,
      tx.category,
      tx.amount,
      tx.date,
    ])
    const csv = [
      ['User', 'Type', 'Category', 'Amount', 'Date'],
      ...rows,
    ]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'admin-transactions.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Transaction Monitoring"
        description="Review income, expenses, user spending behavior, and transaction history."
        icon={Wallet}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MiniCard title="Total Income" value={formatCurrency(totalIncome)} icon={ArrowUpRight} />
        <MiniCard title="Total Expenses" value={formatCurrency(totalExpense)} icon={ArrowDownRight} />
        <MiniCard title="Net Balance" value={formatCurrency(netBalance)} icon={Wallet} />
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input type="date" className="rounded-2xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-600" />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <select value={typeFilter} onChange={handleFilterChange} className="rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm outline-none focus:border-blue-600">
                <option>All Transactions</option>
                <option>Income</option>
                <option>Expense</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleExport}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>

        <DataTable transactions={filteredTransactions} />
      </div>
    </div>
  )
}

function CategoryManagementSection({ categories = [], authToken, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', category_type: 'expense', color: '#22d3ee', icon: 'wallet' })
  const [status, setStatus] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const resetForm = () => {
    setEditingCategory(null)
    setCategoryForm({ name: '', category_type: 'expense', color: '#22d3ee', icon: 'wallet' })
    setStatus(null)
  }

  const openForm = (category = null) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({
        name: category.name || '',
        category_type: category.category_type || 'expense',
        color: category.color || '#22d3ee',
        icon: category.icon || 'wallet',
      })
    } else {
      resetForm()
    }
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    resetForm()
  }

  const handleSaveCategory = async (event) => {
    event.preventDefault()
    setStatus(null)

    if (!categoryForm.name.trim()) {
      setStatus({ type: 'error', text: 'Category name is required.' })
      return
    }

    setIsSaving(true)

    try {
      const data = {
        name: categoryForm.name.trim(),
      }

      if (editingCategory) {
        await updateCategory(authToken, editingCategory.id, data)
        setStatus({ type: 'success', text: 'Category updated successfully.' })
      } else {
        await createCategory(authToken, data)
        setStatus({ type: 'success', text: 'Category created successfully.' })
      }

      closeForm()
      if (typeof onRefresh === 'function') {
        await onRefresh()
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to save category.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCategory = async (category) => {
    const confirmed = window.confirm(`Delete category "${category.name}"?`)
    if (!confirmed) {
      return
    }

    setStatus(null)

    try {
      await deleteCategory(authToken, category.id)
      setStatus({ type: 'success', text: 'Category deleted successfully.' })
      if (typeof onRefresh === 'function') {
        await onRefresh()
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Unable to delete category.' })
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Category Management"
        description="Manage default expense and income categories for users."
        icon={Tag}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => openForm()}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          {showForm ? 'Cancel' : 'Add Category'}
        </button>

        {status ? (
          <div
            className={`rounded-2xl px-4 py-3 text-sm font-medium ${
              status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {status.text}
          </div>
        ) : null}
      </div>

      {showForm ? (
        <form onSubmit={handleSaveCategory} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Name</span>
              <input
                value={categoryForm.name}
                onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600"
                placeholder="Category name"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Type</span>
              <select
                value={categoryForm.category_type}
                onChange={(event) => setCategoryForm((current) => ({ ...current, category_type: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Color</span>
              <input
                value={categoryForm.color}
                onChange={(event) => setCategoryForm((current) => ({ ...current, color: event.target.value }))}
                type="color"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Icon</span>
              <input
                value={categoryForm.icon}
                onChange={(event) => setCategoryForm((current) => ({ ...current, icon: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600"
                placeholder="wallet"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeForm}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {editingCategory ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {categories.length > 0 ? (
          categories.map((category) => (
            <div key={category.id || category.name} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Tag className="h-5 w-5" />
                </div>
                <button
                  type="button"
                  onClick={() => openForm(category)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>

              <h3 className="text-lg font-black text-slate-950">{category.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{category.total || 0} transactions</p>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => openForm(category)}
                  className="rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(category)}
                  className="rounded-xl border border-red-100 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-500">
            No categories found.
          </div>
        )}
      </div>
    </div>
  )
}

function BudgetManagementSection({ budgets = [] }) {
  return (
    <div className="space-y-6">
      <PageHero
        title="Budget Management"
        description="Track user budget limits, spending usage, and critical thresholds."
        icon={TrendingUp}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {budgets.length > 0 ? (
          budgets.map((budget) => {
            const limit = Number(budget.limit || 0)
            const spent = Number(budget.spent || 0)
            const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
            const isCritical = percent >= 85

            return (
              <div key={budget.id || budget.category} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-950">{budget.category || 'Budget'}</h3>
                    <p className="text-sm text-slate-500">
                      {formatCurrency(spent)} of {formatCurrency(limit)} used
                    </p>
                  </div>

                  {isCritical ? (
                    <StatusBadge label="Critical" type="danger" />
                  ) : (
                    <StatusBadge label="Normal" type="success" />
                  )}
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${isCritical ? 'bg-red-500' : 'bg-blue-600'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>{percent.toFixed(0)}% used</span>
                  <span>{formatCurrency(limit - spent)} remaining</span>
                </div>
              </div>
            )
          })
        ) : (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-500">
            No budgets found.
          </div>
        )}
      </div>
    </div>
  )
}

function ReportsSection({ summary, transactions = [] }) {
  const monthlyIncome = Number(summary?.monthly_income || 0)
  const monthlyExpenses = Number(summary?.monthly_expenses || 0)
  const monthlySavings = Number(summary?.monthly_savings || 0)
  const topCategory = transactions.length > 0 ? transactions[0].category || 'N/A' : 'N/A'

  const expenseTransactions = transactions.filter((tx) => tx.type === 'Expense')
  const incomeTransactions = transactions.filter((tx) => tx.type === 'Income')

  const categoryTotals = transactions.reduce((acc, tx) => {
    const category = tx.category || 'Uncategorized'
    acc[category] = (acc[category] || 0) + Number(tx.amount || 0)
    return acc
  }, {})

  const categoryData = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const incomeTotal = incomeTransactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
  const expenseTotal = expenseTransactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
  const incomeRatio = incomeTotal + expenseTotal ? Math.round((incomeTotal / (incomeTotal + expenseTotal)) * 100) : 0
  const expenseRatio = 100 - incomeRatio

  return (
    <div className="space-y-6">
      <PageHero
        title="Reports and Analytics"
        description="View platform insights, user behavior, expenses, income, and budget reports."
        icon={LineChart}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MiniCard title="Monthly Income" value={formatCurrency(monthlyIncome)} icon={ArrowUpRight} />
        <MiniCard title="Monthly Expenses" value={formatCurrency(monthlyExpenses)} icon={ArrowDownRight} />
        <MiniCard title="Monthly Savings" value={formatCurrency(monthlySavings)} icon={TrendingUp} />
        <MiniCard title="Top Category" value={topCategory} icon={PieChart} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-950">Income vs Expense</h3>
              <p className="text-xs text-slate-500">Current period runtime snapshot</p>
            </div>
            <PieChart className="h-5 w-5 text-blue-600" />
          </div>

          <div className="mb-6 flex items-center gap-4">
            <div className="flex-1 rounded-3xl bg-slate-100 p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                <span>Income</span>
                <span>{formatCurrency(incomeTotal)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${incomeRatio}%` }} />
              </div>
            </div>
            <div className="flex-1 rounded-3xl bg-slate-100 p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                <span>Expenses</span>
                <span>{formatCurrency(expenseTotal)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-red-500" style={{ width: `${expenseRatio}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-950">Top Categories</h3>
              <p className="text-xs text-slate-500">Leading spending and income categories</p>
            </div>
            <PieChart className="h-5 w-5 text-blue-600" />
          </div>

          <div className="space-y-4">
            {categoryData.length > 0 ? (
              categoryData.map(([category, amount]) => (
                <div key={category}>
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{category}</span>
                    <span>{formatCurrency(amount)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min((amount / Math.max(categoryData[0][1], 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                No category data available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FeedbackSection({ feedback = [] }) {
  return (
    <div className="space-y-6">
      <PageHero
        title="Feedback and Support"
        description="Read user feedback, complaints, suggestions, and support requests."
        icon={MessageSquare}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {feedback.length > 0 ? (
          feedback.map((item) => (
            <div key={item.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-950">{item.user || 'Guest'}</h3>
                  <p className="text-sm text-slate-500">{item.email}</p>
                </div>

                <StatusBadge
                  label={item.status}
                  type={item.status === 'resolved' ? 'success' : 'warning'}
                />
              </div>

              <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                {item.message}
              </p>

              <div className="mt-5 flex justify-end">
                <a
                  href={item.email ? `mailto:${item.email}?subject=Sinop admin response` : '#'}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-white ${
                    item.email ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 text-slate-600 pointer-events-none'
                  }`}
                >
                  <Send className="h-4 w-4" />
                  Reply
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-500">
            No feedback available.
          </div>
        )}
      </div>
    </div>
  )
}

function SecurityLogsSection({ logs = [] }) {
  return (
    <div className="space-y-6">
      <PageHero
        title="Security Logs"
        description="Track login activity, failed attempts, admin changes, and security events."
        icon={ShieldAlert}
      />

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-5">
          {logs.length > 0 ? (
            logs.map((log, index) => {
              const isSuccess = log.status === 'success'

              return (
                <div key={log.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {isSuccess ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                    </div>
                    {index !== logs.length - 1 && <div className="mt-2 h-10 w-px bg-slate-200" />}
                  </div>

                  <div className="flex-1 pb-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-black text-slate-950">{log.title}</h3>
                        <p className="text-xs text-slate-500">{log.user || 'System'}</p>
                      </div>
                      <p className="text-xs font-bold text-slate-400">{log.time}</p>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-500">
              No security logs available.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NotificationsSection({ notifications = [], authToken, onRefresh }) {
  const [notificationType, setNotificationType] = useState('System Announcement')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSendNotification = async (event) => {
    event.preventDefault()
    if (!message.trim()) {
      setStatus({ type: 'error', text: 'Please enter a notification message.' })
      return
    }

    setIsSubmitting(true)
    setStatus(null)

    try {
      await createNotification(authToken, {
        title: notificationType,
        message: message.trim(),
        notification_type: notificationType,
      })
      setMessage('')
      setStatus({ type: 'success', text: 'Notification sent successfully.' })
      if (typeof onRefresh === 'function') {
        onRefresh()
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Unable to send notification.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Notifications"
        description="Review the latest platform alerts, messages, and scheduled notifications."
        icon={Bell}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-950">Recent Notifications</h3>
              <p className="text-xs text-slate-500">Latest user alerts and system messages</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div key={notification.id} className="space-y-2 border-b border-slate-100 px-4 py-4 last:border-none">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-bold text-slate-950">{notification.title}</h4>
                    <span className="text-xs text-slate-400">{new Date(notification.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-600">{notification.message}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-10 text-center text-sm font-medium text-slate-500">
                No notifications found.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <PageHero
            title="Message Center"
            description="Compose a notification when you want to communicate platform updates."
            icon={Mail}
          />

          <form onSubmit={handleSendNotification} className="space-y-5 pt-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Notification Type</label>
              <select
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600"
              >
                <option>Budget Limit Alert</option>
                <option>System Announcement</option>
                <option>Security Alert</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="h-36 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-600"
                placeholder="Write your notification message..."
              />
            </div>

            {status && (
              <div
                className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                  status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {status.text}
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Sending...' : 'Send Notification'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function SettingsSection({ currentUser, authToken }) {
  const [fullName, setFullName] = useState(currentUser?.full_name || '')
  const [darkMode, setDarkMode] = useState(Boolean(currentUser?.settings?.dark_mode))
  const [status, setStatus] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setFullName(currentUser?.full_name || '')
    setDarkMode(Boolean(currentUser?.settings?.dark_mode))
  }, [currentUser])

  const handleSave = async () => {
    if (!authToken) {
      setStatus({ type: 'error', text: 'Unable to save settings without a valid session.' })
      return
    }

    setIsSaving(true)
    setStatus(null)

    try {
      if (fullName !== currentUser?.full_name) {
        await updateProfile(authToken, { fullName })
      }
      await updateSettings(authToken, { dark_mode: darkMode })
      setStatus({ type: 'success', text: 'Settings saved successfully.' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to save settings.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Admin Settings"
        description="Update admin profile, account security, and system preferences."
        icon={Settings}
      />

      <div className="grid max-w-5xl grid-cols-1 gap-6 xl:grid-cols-2">
        <SettingsCard title="Profile Information" icon={Users}>
          <InputField
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <InputField label="Email Address" value={currentUser?.email || ''} disabled icon={Mail} />
        </SettingsCard>

        <SettingsCard title="Security" icon={Lock}>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            Password changes are managed via your account profile. Use the standard app settings page for password updates.
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            <span className="font-medium text-slate-700">Enable dark mode</span>
          </label>
        </SettingsCard>
      </div>

      {status && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-medium ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {status.text}
        </div>
      )}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

function PageHero({ title, description, icon }) {
  const IconComponent = icon

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <IconComponent className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatCard({ label, value, change, icon }) {
  const toneClass = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    violet: 'bg-violet-50 text-violet-600',
  }[change.includes('+') ? 'blue' : 'violet']
  const IconComponent = icon

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="mb-5 flex items-center justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}>
          <IconComponent className="h-5 w-5" />
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-600">
          {change}
        </span>
      </div>

      <p className="text-sm font-bold text-slate-500">{label}</p>
      <h3 className="mt-1 text-3xl font-black tracking-tight text-slate-950">{value}</h3>
    </div>
  )
}

function MiniCard({ title, value, icon }) {
  const IconComponent = icon

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <IconComponent className="h-5 w-5" />
      </div>
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <h3 className="mt-1 text-2xl font-black text-slate-950">{value}</h3>
    </div>
  )
}

function RecentUsers({ users }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm xl:col-span-2">
      <div className="border-b border-slate-100 p-5">
        <h3 className="text-sm font-black text-slate-950">Recent Users</h3>
        <p className="text-xs text-slate-500">Latest registered accounts</p>
      </div>

      <div className="divide-y divide-slate-100">
        {users.slice(0, 5).map((user) => (
          <div key={user.id} className="flex items-center justify-between gap-4 p-5 hover:bg-slate-50">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950">{user.full_name || 'Unnamed User'}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
            <StatusBadge label="Active" type="success" />
          </div>
        ))}

        {users.length === 0 && (
          <div className="p-8 text-center text-sm font-medium text-slate-400">
            No users available.
          </div>
        )}
      </div>
    </div>
  )
}

function ActivityFeed({ logs = [] }) {
  const feedItems = logs.length > 0 ? logs.slice(0, 5) : placeholderLogs

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <h3 className="text-sm font-black text-slate-950">Activity Feed</h3>
        <p className="text-xs text-slate-500">Latest admin and system events</p>
      </div>

      <div className="divide-y divide-slate-100">
        {feedItems.map((log, index) => (
          <div key={log.id || index} className="flex gap-3 p-5">
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
            <div>
              <p className="text-sm font-bold text-slate-950">{log.title}</p>
              <p className="text-xs text-slate-500">{log.time || log.user || 'No details available'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HealthItem({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
      <span className="text-sm font-medium text-slate-400">{label}</span>
      <span className="text-sm font-black text-emerald-400">{value}</span>
    </div>
  )
}

function DataTable({ transactions }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-5 py-4">User</th>
            <th className="px-5 py-4">Type</th>
            <th className="px-5 py-4">Category</th>
            <th className="px-5 py-4">Amount</th>
            <th className="px-5 py-4 text-right">Date</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {transactions.map((tx) => {
            const isIncome = tx.type === 'Income'

            return (
              <tr key={tx.id} className="hover:bg-slate-50">
                <td className="px-5 py-4 font-bold text-slate-950">{tx.user}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 font-bold ${
                    isIncome ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {isIncome ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {tx.type}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {tx.category}
                  </span>
                </td>
                <td className="px-5 py-4 font-black text-slate-950">{formatCurrency(tx.amount)}</td>
                <td className="px-5 py-4 text-right text-slate-500">{tx.date}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ChartPlaceholder({ title }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-950">{title}</h3>
          <p className="text-xs text-slate-500">Connect this area to your analytics API.</p>
        </div>
        <BarChart3 className="h-5 w-5 text-blue-600" />
      </div>

      <div className="flex h-72 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50">
        <div className="text-center">
          <LineChart className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          <p className="text-sm font-bold text-slate-400">Chart Preview Area</p>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ label, type }) {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    danger: 'bg-red-50 text-red-700 border-red-100',
  }

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black capitalize ${styles[type]}`}>
      {label}
    </span>
  )
}

function SettingsCard({ title, icon, children }) {
  const IconComponent = icon

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <IconComponent className="h-5 w-5" />
        </div>
        <h3 className="text-base font-black text-slate-950">{title}</h3>
      </div>

      <div className="space-y-4">{children}</div>
    </div>
  )
}

function InputField({ label, icon: Icon, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />}
        <input
          {...props}
          className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 disabled:bg-slate-50 disabled:text-slate-400 ${
            Icon ? 'pl-11' : ''
          }`}
        />
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm font-bold text-slate-500">Loading admin dashboard...</p>
      </div>
    </div>
  )
}

function ErrorScreen({ error }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-black text-slate-950">System Error</h1>
        <p className="mt-2 text-sm text-red-500">{error}</p>
      </div>
    </div>
  )
}

function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-black text-slate-950">Access Denied</h1>
        <p className="mt-2 text-sm text-slate-500">
          You do not have permission to access the admin dashboard.
        </p>
      </div>
    </div>
  )
}