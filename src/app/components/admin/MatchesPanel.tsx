// @ts-nocheck
import { Link } from '@/app/lib/router-compat'
import { Sparkles } from 'lucide-react'
import { ItemThumb } from '../ItemBits'
import { EmptyState } from '../ui'

export default function MatchesPanel({ data }) {
  if (!data.matches.length) {
    return <EmptyState icon={Sparkles} title="Sem correspondências">Nenhum relato aberto combina com os objetos cadastrados no momento.</EmptyState>
  }
  return (
    <ul className="space-y-4">
      {data.matches.map(({ report, matches }) => (
        <li key={report.id} className="card p-5">
          <p className="text-xs text-muted">{report.ref} · {[report.contactEmail, report.contactPhone].filter(Boolean).join(' · ')}</p>
          <p className="font-bold text-navy-900">Relato: {report.name} <span className="font-normal text-muted">— {report.location}</span></p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {matches.map((m) => (
              <Link key={m.item.id} to={`/objeto/${m.item.id}`} className="flex gap-3 rounded-xl border border-line p-2 transition hover:border-flame-400">
                <div className="size-14 shrink-0 overflow-hidden rounded-lg"><ItemThumb item={m.item} /></div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy-900">{m.item.name}</p>
                  <p className="text-xs font-bold text-flame-600">{m.score}% compatível</p>
                  <p className="truncate text-xs text-muted">{m.reasons.slice(0, 2).join(' · ')}</p>
                </div>
              </Link>
            ))}
          </div>
        </li>
      ))}
    </ul>
  )
}
