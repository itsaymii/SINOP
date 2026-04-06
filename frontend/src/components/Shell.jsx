import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

import logo from '../assets/logo.svg'
import { AuthModal } from './AuthModal'
import { authenticatedNavItems, navItems } from '../data/siteContent'

const shellBackground = {
  backgroundImage:
    'radial-gradient(circle at top left, rgba(34, 211, 238, 0.12), transparent 20%), radial-gradient(circle at 80% 5%, rgba(148, 163, 184, 0.12), transparent 22%), linear-gradient(180deg, #fbfdff 0%, #f4f8fb 48%, #edf3f7 100%)',
}

export function Shell({ children, isAuthenticated, currentUser, onLogout, authModalMode, onOpenAuthModal, onCloseAuthModal, onAuthenticate, onSwitchAuthMode, authModalSuccessMessage, authModalInitialEmail }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const location = useLocation()
  const activeNavItems = isAuthenticated ? authenticatedNavItems : navItems

  useEffect(() => {
    setIsMenuOpen(false)
    setIsProfileMenuOpen(false)
  }, [location.pathname])

  function toggleMenu() {
    setIsMenuOpen((previous) => !previous)
  }

  function openAuth(mode) {
    setIsMenuOpen(false)
    onOpenAuthModal(mode)
  }

  function toggleProfileMenu() {
    setIsProfileMenuOpen((previous) => !previous)
  }

  function handleLogout() {
    setIsProfileMenuOpen(false)
    setIsMenuOpen(false)
    onLogout()
  }

  const profileLabel = currentUser?.full_name || currentUser?.email || 'Profile'
  const profileInitial = profileLabel.trim().charAt(0).toUpperCase() || 'P'

  return (
    <div className="min-h-screen text-slate-900" style={shellBackground}>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="sticky top-5 z-20 rounded-[1.9rem] border border-cyan-400/12 bg-white/72 px-5 py-4 shadow-[0_20px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center justify-between gap-4">
              <Link to="/" className="text-slate-900 no-underline">
                <img src={logo} alt="Sinop logo" className="h-11 w-auto object-contain sm:h-14" />
              </Link>

              <button
                type="button"
                onClick={toggleMenu}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-navigation"
                aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 xl:hidden"
              >
                <span className="sr-only">Menu</span>
                <span className="flex w-5 flex-col gap-1.5">
                  <span
                    className={`block h-0.5 w-full rounded-full bg-current transition ${isMenuOpen ? 'translate-y-2 rotate-45' : ''}`}
                  />
                  <span
                    className={`block h-0.5 w-full rounded-full bg-current transition ${isMenuOpen ? 'opacity-0' : ''}`}
                  />
                  <span
                    className={`block h-0.5 w-full rounded-full bg-current transition ${isMenuOpen ? '-translate-y-2 -rotate-45' : ''}`}
                  />
                </span>
              </button>
            </div>

            <nav className="hidden flex-wrap items-center gap-2 xl:flex xl:flex-1 xl:justify-center">
              {activeNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-cyan-400/12 text-cyan-900 shadow-[0_14px_30px_rgba(34,211,238,0.08)] ring-1 ring-cyan-300/22'
                        : 'text-slate-600 hover:bg-cyan-50 hover:text-slate-950'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="hidden flex-wrap items-center gap-2 xl:flex xl:justify-end">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleProfileMenu}
                    aria-label="Open profile menu"
                    className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-cyan-200/70 bg-[linear-gradient(135deg,#ecfeff_0%,#cffafe_100%)] text-sm font-black text-cyan-900 shadow-[0_14px_30px_rgba(34,211,238,0.14)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(34,211,238,0.18)]"
                  >
                    <span className="sr-only">Profile</span>
                    <span className="relative flex h-full w-full items-center justify-center">
                      <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),transparent_48%)]" />
                      <span className="absolute bottom-0 h-6 w-6 rounded-full bg-cyan-900/10 blur-md" />
                      <span className="relative grid h-8 w-8 place-items-center rounded-full border border-white/70 bg-white/70 text-xs font-black text-cyan-900">
                        {profileInitial}
                      </span>
                    </span>
                  </button>

                  {isProfileMenuOpen ? (
                    <div className="absolute right-0 top-[calc(100%+0.75rem)] w-56 rounded-[1.6rem] border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Profile</p>
                        <p className="mt-2 truncate text-sm font-bold text-slate-900">{profileLabel}</p>
                      </div>
                      <Link
                        to="/settings"
                        className="mt-1 block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-900"
                      >
                        Profile Settings
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-1 block w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        Log out
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => openAuth('login')}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold tracking-[0.01em] text-slate-700 transition hover:bg-slate-50"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuth('register')}
                    className="rounded-full bg-[linear-gradient(135deg,#22d3ee_0%,#67e8f9_100%)] px-4 py-2 text-sm font-bold tracking-[0.01em] text-slate-950 shadow-[0_14px_30px_rgba(34,211,238,0.16)] transition hover:-translate-y-0.5"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>

            <div
              id="mobile-navigation"
              className={`${isMenuOpen ? 'grid' : 'hidden'} gap-5 border-t border-slate-200 pt-4 xl:hidden`}
            >
              <nav className="grid gap-2">
                {activeNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        isActive
                          ? 'bg-cyan-400/12 text-cyan-900 shadow-[0_14px_30px_rgba(34,211,238,0.08)] ring-1 ring-cyan-300/22'
                          : 'bg-white/75 text-slate-600 hover:bg-cyan-50 hover:text-slate-950'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="grid gap-2 sm:grid-cols-2">
                {isAuthenticated ? (
                  <div className="sm:col-span-2 rounded-[1.6rem] border border-slate-200 bg-white/90 p-3 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
                    <button
                      type="button"
                      onClick={toggleProfileMenu}
                      className="flex w-full items-center justify-between rounded-2xl px-2 py-2 text-left transition hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-cyan-200/70 bg-[linear-gradient(135deg,#ecfeff_0%,#cffafe_100%)] text-cyan-900 shadow-[0_12px_25px_rgba(34,211,238,0.12)]">
                          <span className="grid h-7 w-7 place-items-center rounded-full border border-white/70 bg-white/80 text-xs font-black text-cyan-900">
                            {profileInitial}
                          </span>
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Profile</p>
                          <p className="max-w-32 truncate text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{profileLabel}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Menu</span>
                    </button>

                    {isProfileMenuOpen ? (
                      <div className="mt-2 grid gap-2">
                        <Link
                          to="/settings"
                          className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-900"
                        >
                          Profile Settings
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="rounded-2xl px-4 py-3 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          Log out
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => openAuth('login')}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-bold tracking-[0.01em] text-slate-700 transition hover:bg-slate-50"
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => openAuth('register')}
                      className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#22d3ee_0%,#67e8f9_100%)] px-4 py-3 text-sm font-bold tracking-[0.01em] text-slate-950 shadow-[0_14px_30px_rgba(34,211,238,0.16)] transition hover:-translate-y-0.5"
                    >
                      Sign up
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 px-1 py-8 sm:px-2 lg:px-3">{children}</div>

        {authModalMode ? (
          <AuthModal
            mode={authModalMode}
            onAuthenticate={onAuthenticate}
            onClose={onCloseAuthModal}
            onSwitchMode={onSwitchAuthMode}
            successMessage={authModalSuccessMessage}
            initialEmail={authModalInitialEmail}
          />
        ) : null}

        <footer className="mt-auto border-t border-slate-200 px-2 py-6 text-sm text-slate-500">
          <div className="flex flex-col gap-2 text-center md:flex-row md:items-center md:justify-between md:text-left">
            <p>Sinop</p>
            <p className="text-slate-600">Masinop sa gastos, mas malinaw ang plano.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
