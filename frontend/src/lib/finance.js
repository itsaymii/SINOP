const API_BASE = import.meta.env.VITE_API_BASE || '/api'

async function parseResponse(response) {
  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json() : null

  if (!response.ok) {
    const detail = payload?.detail || Object.values(payload || {}).flat().find(Boolean) || 'Something went wrong.'
    throw new Error(detail)
  }

  return payload
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Token ${token}`,
  }
}

function withQuery(url, query = {}) {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value)
    }
  })

  const suffix = params.toString()
  return `${url}${suffix ? `?${suffix}` : ''}`
}

async function request(token, path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...authHeaders(token),
      ...options.headers,
    },
  })

  return parseResponse(response)
}

export function fetchDashboardSummary(token) {
  return request(token, '/dashboard/')
}

export function fetchAdminDashboardSummary(token) {
  return request(token, '/admin/dashboard/')
}

export function fetchTransactions(token, query) {
  return request(token, withQuery('/transactions/', query))
}

export function createTransaction(token, payload) {
  return request(token, '/transactions/', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateTransaction(token, id, payload) {
  return request(token, `/transactions/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function deleteTransaction(token, id) {
  await fetch(`${API_BASE}/transactions/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}

export function fetchCategories(token) {
  return request(token, '/categories/')
}

export function createCategory(token, payload) {
  return request(token, '/categories/', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateCategory(token, id, payload) {
  return request(token, `/categories/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function deleteCategory(token, id) {
  await fetch(`${API_BASE}/categories/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}

export function fetchAccounts(token) {
  return request(token, '/accounts/')
}

export function createAccount(token, payload) {
  return request(token, '/accounts/', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateAccount(token, id, payload) {
  return request(token, `/accounts/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function deleteAccount(token, id) {
  await fetch(`${API_BASE}/accounts/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}

export function fetchBudgets(token) {
  return request(token, '/budgets/')
}

export function createBudget(token, payload) {
  return request(token, '/budgets/', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateBudget(token, id, payload) {
  return request(token, `/budgets/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export function fetchGoals(token) {
  return request(token, '/goals/')
}

export function createGoal(token, payload) {
  return request(token, '/goals/', { method: 'POST', body: JSON.stringify(payload) })
}

export function fetchBills(token) {
  return request(token, '/bills/')
}

export function createBill(token, payload) {
  return request(token, '/bills/', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateBill(token, id, payload) {
  return request(token, `/bills/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export function fetchSettings(token) {
  return request(token, '/settings/')
}

export function updateSettings(token, payload) {
  return request(token, '/settings/', { method: 'PATCH', body: JSON.stringify(payload) })
}

export function fetchNotifications(token) {
  return request(token, '/notifications/')
}

export function createNotification(token, payload) {
  return request(token, '/notifications/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function markNotificationRead(token, id) {
  return request(token, `/notifications/${id}/mark_read/`, { method: 'POST' })
}

// --- ADMIN ENDPOINTS ---
export function fetchAdminUsers(token) {
  return request(token, '/admin/users/')
}

export function fetchAdminTransactions(token) {
  return request(token, '/admin/transactions/')
}

export function fetchAdminCategories(token) {
  return request(token, '/admin/categories/')
}

export function fetchAdminBudgets(token) {
  return request(token, '/admin/budgets/')
}

export function fetchAdminFeedback(token) {
  return request(token, '/admin/feedback/')
}

export function fetchAdminLogs(token) {
  return request(token, '/admin/logs/')
}