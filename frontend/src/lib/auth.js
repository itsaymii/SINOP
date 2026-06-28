const API_BASE = import.meta.env.VITE_API_BASE
  ? `${import.meta.env.VITE_API_BASE.replace(/\/$/, '')}/auth`
  : '/api/auth'

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
  return token
    ? {
        Authorization: `Token ${token}`,
      }
    : {}
}

export async function registerAccount({ fullName, email, password, monthlyBudgetGoal }) {
  return parseResponse(
    await fetch(`${API_BASE}/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: fullName,
        email,
        password,
        monthly_budget_goal: monthlyBudgetGoal,
      }),
    })
  )
}

export async function loginAccount({ email, password }) {
  return parseResponse(
    await fetch(`${API_BASE}/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
  )
}

export async function fetchCurrentUser(token) {
  return parseResponse(
    await fetch(`${API_BASE}/me/`, {
      headers: {
        ...authHeaders(token),
      },
    })
  )
}

export async function updateProfile(token, { fullName, monthlyBudgetGoal }) {
  return parseResponse(
    await fetch(`${API_BASE}/me/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify({
        full_name: fullName,
        monthly_budget_goal: monthlyBudgetGoal,
      }),
    })
  )
}

export async function logoutAccount(token) {
  const response = await fetch(`${API_BASE}/logout/`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
    },
  })

  if (!response.ok && response.status !== 401) {
    await parseResponse(response)
  }
}