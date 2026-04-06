export const ACCOUNT_TYPE_OPTIONS = [
  { value: 'wallet', label: 'Wallet' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit', label: 'Credit' },
  { value: 'loan', label: 'Loans' },
]

const ACCOUNT_TYPE_LABELS = {
  wallet: 'Wallet',
  savings: 'Savings',
  credit: 'Credit',
  loan: 'Loans',
  cash: 'Cash',
  bank: 'Bank Account',
  ewallet: 'E-Wallet',
}

export function formatAccountTypeLabel(accountType) {
  return ACCOUNT_TYPE_LABELS[accountType] || accountType || 'Account'
}

export function isLiabilityAccountType(accountType) {
  return accountType === 'credit' || accountType === 'loan'
}

export function getSignedAccountBalance(account) {
  const amount = Number(account?.balance || 0)
  return isLiabilityAccountType(account?.account_type) ? amount * -1 : amount
}
