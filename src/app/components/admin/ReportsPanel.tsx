// @ts-nocheck
import { ClipboardList, MapPin, Calendar } from 'lucide-react'
import { setReportOpen } from '../../data/api'
import { categoryLabel } from '../../data/constants'
import { formatDate } from '../../lib/format'
import { Button, EmptyState } from '../ui'
import { useAction } from './useAction'

export default function ReportsPanel({ data, refresh }) {
  const { busy, run } = useAction(refresh)
  if (!data.reports.length) return <EmptyState icon={ClipboardList} title="Nenhum relato">Ainda não há relatos de perda.</EmptyState>

  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {data.reports.map((r) => (
        <li key={r.id} className="card flex gap-4 p-4">
          {r.photo && <img src={r.photo} alt="" className="size-20 shrink-0 rounded-xl object-cover" />}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`chip ${r.open ? 'bg-flame-100 text-flame-600' : 'bg-navy-50 text-navy-800'}`}>{r.open ? 'Aberto' : 'Encerrado'}</span>
              <span className="text-xs font-semibold text-navy-900">{r.ref}</span>
            </div>
            <p className="mt-1 font-bold text-navy-900">{r.name}</p>
            <p className="flex flex-wrap gap-x-3 text-xs text-muted">
              <span>{categoryLabel(r.category)}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{r.location}</span>
              <span className="inline-flex items-center gap-1"><Calendar className="size-3" />{formatDate(r.dateLost)}</span>
            </p>
            <p className="mt-2 line-clamp-2 text-sm text-ink/80">{r.description}</p>
            <p className="mt-1 text-xs text-muted">{[r.contactEmail, r.contactPhone].filter(Boolean).join(' · ')}</p>
            <Button variant="outline" className="mt-3 py-1.5" loading={busy === r.id}
              onClick={() => run(r.id, () => setReportOpen(r.id, !r.open), r.open ? 'Relato encerrado.' : 'Relato reaberto.')}>
              {r.open ? 'Encerrar' : 'Reabrir'}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
