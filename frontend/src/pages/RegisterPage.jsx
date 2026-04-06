import { AuthPage } from './AuthPage'

export function RegisterPage({ onAuthenticate }) {
  return <AuthPage mode="register" onAuthenticate={onAuthenticate} />
}
