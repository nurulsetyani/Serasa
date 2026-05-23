import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'POS Cashier — Serasa',
}

export default function POSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ touchAction: 'none' }}>
      {children}
    </div>
  )
}
