// @ts-nocheck
import { useState } from 'react'
import useSWR from 'swr'
import { Ticket, Boxes, ClipboardList, Sparkles, KeyRound, ShieldAlert } from 'lucide-react'
import { adminOverview } from '../data/api'
import { EmptyState, Spinner } from '../components/ui'
import ClaimsPanel from '../components/admin/ClaimsPanel'
import ItemsPanel from '../components/admin/ItemsPanel'
import ReportsPanel from '../components/admin/ReportsPanel'
import MatchesPanel from '../components/admin/MatchesPanel'
import ValidatePanel from '../components/admin/ValidatePanel'

export default function Admin() {
  const [tab, setTab] = useState('claims')
  const { data, error, isLoading, mutate } = useSWR(['admin', 'overview'], adminOverview)

  if (isLoading) return <Spinner label="Carregando painel…" />
  if (error) {
    return <div className="mx-auto max-w-xl px-4 py-16"><EmptyState icon={ShieldAlert} title="Não foi possível carregar">{error.message}</EmptyState></div>
  }

  const pending = data.claims.filter((c) => c.status === 'Em análise').length
  const tabs = [
    { id: 'claims', label: 'Solicitações', icon: Ticket, badge: pending },
    { id: 'items', label: 'Objetos', icon: Boxes, badge: data.items.length },
    { id: 'reports', label: 'Relatos', icon: ClipboardList, badge: data.reports.filter((r) => r.open).length },
    { id: 'matches', label: 'Correspondências', icon: Sparkles, badge: data.matches.length },
    { id: 'validate', label: 'Validar código', icon: KeyRound },
  ]
  const props = { data, refresh: mutate }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-flame-600">Recepção</p>
        <h1 className="mt-1 text-3xl font-extrabold text-navy-900 sm:text-4xl">Painel de administração</h1>
        <p className="mt-2 text-muted">Contatos aparecem mascarados. Toda ação é verificada pelo banco de dados.</p>
      </header>
      <div role="tablist" aria-label="Seções do painel" className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-line bg-white p-1">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === id ? 'bg-navy-900 text-white' : 'text-navy-900/80 hover:bg-navy-50'}`}>
            <Icon className="size-4" /> {label}
            {badge > 0 && <span className={`rounded-full px-1.5 text-xs ${tab === id ? 'bg-flame-500 text-white' : 'bg-flame-100 text-flame-600'}`}>{badge}</span>}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'claims' && <ClaimsPanel {...props} />}
        {tab === 'items' && <ItemsPanel {...props} />}
        {tab === 'reports' && <ReportsPanel {...props} />}
        {tab === 'matches' && <MatchesPanel {...props} />}
        {tab === 'validate' && <ValidatePanel {...props} />}
      </div>
    </div>
  )
}
