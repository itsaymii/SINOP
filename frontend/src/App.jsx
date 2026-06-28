import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { Shell } from './components/Shell'
import { fetchCurrentUser, loginAccount, logoutAccount, registerAccount, updateProfile } from './lib/auth'
import { AboutPage } from './pages/AboutPage'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'
import { InsightsPage } from './pages/InsightsPage'
import { SettingsPage } from './pages/SettingsPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminLoginPage } from './pages/AdminLoginPage'

const AUTH_TOKEN_STORAGE_KEY = 'sinop-auth-token'
const AUTH_USER_STORAGE_KEY = 'sinop-auth-user'

function ProtectedRoute({ children, authReady, isAuthenticated }) {
  const location = useLocation()

  if (!authReady) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to={`/?auth=login&redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  return children
}

function AdminProtectedRoute({ children, authReady, isAuthenticated, currentUser }) {
  if (!authReady) {
    return null
  }

  if (!isAuthenticated || !currentUser?.is_staff) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [authToken, setAuthToken] = useState(() => window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || '')
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = window.localStorage.getItem(AUTH_USER_STORAGE_KEY)

    if (!storedUser) {
      return null
    }

    try {
      return JSON.parse(storedUser)
    } catch {
      return null
    }
  })
  const [authReady, setAuthReady] = useState(false)

  const isAuthenticated = Boolean(authToken)

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const authModalMode = ['login', 'register'].includes(searchParams.get('auth'))
    ? searchParams.get('auth')
    : null
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const registeredNotice = searchParams.get('registered') === '1'
    ? 'Account created successfully. Log in with your credentials to open your dashboard.'
    : ''
  const authInitialEmail = searchParams.get('email') || ''

  useEffect(() => {
    let isActive = true

    async function restoreSession() {
      if (!authToken) {
        if (isActive) {
          setCurrentUser(null)
          setAuthReady(true)
        }
        return
      }

      try {
        const response = await fetchCurrentUser(authToken)

        if (!isActive) {
          return
        }

        setCurrentUser(response.user)
        window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(response.user))
      } catch {
        if (!isActive) {
          return
        }

        window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
        window.localStorage.removeItem(AUTH_USER_STORAGE_KEY)
        setAuthToken('')
        setCurrentUser(null)
      } finally {
        if (isActive) {
          setAuthReady(true)
        }
      }
    }

    restoreSession()

    return () => {
      isActive = false
    }
  }, [authToken])

  useEffect(() => {
    function handleOpenAuth(event) {
      openAuthModal(event.detail === 'login' ? 'login' : 'register')
    }

    window.addEventListener('sinop:open-auth', handleOpenAuth)

    return () => {
      window.removeEventListener('sinop:open-auth', handleOpenAuth)
    }
  }, [location.pathname, location.search])

  function updateSearch(nextParams) {
    const query = nextParams.toString()
    navigate(`${location.pathname}${query ? `?${query}` : ''}`, { replace: true })
  }

  function openAuthModal(mode, nextRedirect = '/dashboard', extras = {}) {
    const params = new URLSearchParams(location.search)
    params.set('auth', mode)
    params.set('redirect', nextRedirect)

     Object.entries(extras).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    updateSearch(params)
  }

  function closeAuthModal() {
    const params = new URLSearchParams(location.search)
    params.delete('auth')
    params.delete('redirect')
    params.delete('registered')
    params.delete('email')
    updateSearch(params)
  }

  function switchAuthMode() {
    if (!authModalMode) {
      return
    }

    openAuthModal(authModalMode === 'login' ? 'register' : 'login', redirectTo)
  }

  async function handleAuthenticate({ mode, email, fullName, password, monthlyBudgetGoal }) {
    if (mode === 'register') {
      await registerAccount({ fullName, email, password, monthlyBudgetGoal })
      openAuthModal('login', redirectTo, { registered: '1', email })
      return { registered: true }
    }

    const response = await loginAccount({ email, password })

    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, response.token)
    window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(response.user))
    setAuthToken(response.token)
    setCurrentUser(response.user)

    const nextRoute = response.user?.is_staff ? '/admin' : redirectTo
    navigate(nextRoute, { replace: true })
    return response
  }

  async function handleAdminLogin({ email, password }) {
    const response = await loginAccount({ email, password })

    if (!response.user?.is_staff) {
      throw new Error('These credentials are not authorized for the admin dashboard.')
    }

    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, response.token)
    window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(response.user))
    setAuthToken(response.token)
    setCurrentUser(response.user)
    navigate('/admin', { replace: true })
    return response
  }

  async function handleLogout() {
    const tokenToRevoke = authToken

    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY)
    setAuthToken('')
    setCurrentUser(null)

    if (tokenToRevoke) {
      try {
        await logoutAccount(tokenToRevoke)
      } catch {
        // Logout should still succeed locally even if the backend token was already invalid.
      }
    }
  }

  async function handleProfileUpdate(profileUpdates) {
    if (!authToken) {
      throw new Error('You must be logged in to update your profile.')
    }

    const response = await updateProfile(authToken, profileUpdates)
    setCurrentUser(response.user)
    window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(response.user))
    return response.user
  }

  const isAdminRoute = location.pathname.startsWith('/admin')

  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage onAdminLogin={handleAdminLogin} />} />
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute authReady={authReady} isAuthenticated={isAuthenticated} currentUser={currentUser}>
              <AdminDashboardPage authToken={authToken} currentUser={currentUser} onLogout={handleLogout} />
            </AdminProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    )
  }

  return (
    <Shell
      isAuthenticated={isAuthenticated}
      currentUser={currentUser}
      onLogout={handleLogout}
      authModalMode={authModalMode}
      onOpenAuthModal={openAuthModal}
      onCloseAuthModal={closeAuthModal}
      onAuthenticate={handleAuthenticate}
      onSwitchAuthMode={switchAuthMode}
      authModalSuccessMessage={registeredNotice}
      authModalInitialEmail={authInitialEmail}
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute authReady={authReady} isAuthenticated={isAuthenticated}>
              <DashboardPage authToken={authToken} currentUser={currentUser} onUpdateProfile={handleProfileUpdate} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute authReady={authReady} isAuthenticated={isAuthenticated}>
              <TransactionsPage authToken={authToken} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <ProtectedRoute authReady={authReady} isAuthenticated={isAuthenticated}>
              <InsightsPage authToken={authToken} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute authReady={authReady} isAuthenticated={isAuthenticated}>
              <SettingsPage authToken={authToken} currentUser={currentUser} onUpdateProfile={handleProfileUpdate} />
            </ProtectedRoute>
          }
        />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<Navigate to="/?auth=login" replace />} />
        <Route path="/register" element={<Navigate to="/?auth=register" replace />} />
      </Routes>
    </Shell>
  )
}

export default App
