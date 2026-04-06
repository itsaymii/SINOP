import { AuthPage } from './AuthPage'

export function LoginPage({ onAuthenticate }) {
  return <AuthPage mode="login" onAuthenticate={onAuthenticate} />
}
