import { reconcilePendingPayments } from '../utils/payments/reconciliation'

export default defineNitroPlugin(() => {
  if (process.env.NODE_ENV === 'test') return

  const run = () => reconcilePendingPayments(20).catch(error => {
    console.warn('[PAYMENT RECONCILIATION]:', error?.message || error)
  })

  setTimeout(run, 10_000)
  setInterval(run, 60_000)
})
