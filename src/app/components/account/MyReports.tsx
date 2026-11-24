// @ts-nocheck
import { useState } from 'react'
import { Link } from '@/app/lib/router-compat'
import useSWR, { useSWRConfig } from 'swr'
import { ClipboardList, MapPin, Calendar } from 'lucide-react'
import { listMyReports, setMyReportOpen, deleteMyReport } from '../../data/api'
import { categoryLabel } from '../../data/constants'
import { formatDate } from '../../lib/format'
import { useAuth } from '../../auth/AuthProvider'
import { Button, EmptyState, Spinner, useToast } from '../ui'

export default function MyReports() {
  const { user } = useAuth()
  const toast = useToast()
  const { mutate: globalMutate } = useSWRConfig()
  const { data, error, isLoading, mutate } = useSWR(['my-reports', user.id], listMyReports)
  const [busyId, setBusyId] = useState(null)

  async function run(id, fn, message) {
    setBusyId(id)
    try {
      await fn()
      toast(message)
      mutate()
      globalMutate(['public', 'stats'])
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  if (isLoading) return <Spinner />
  if (error) return <EmptyState icon={ClipboardList} title="Algo deu errado">{error.message}</EmptyState>
  if (!data.length) {
    return <EmptyState icon={ClipboardList} title="Nenhum relato">Perdeu algo? <Link to="/perdi" className="font-semibold text-flame-600 underline">Crie um relato de perda</Link>.</EmptyState>
  }

  return (
    <ul className="space-y-3">
      {data.map((r) => (
        <li key={r.id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          {r.photo && <img src={r.photo} alt="" className="size-20 shrink-0 rounded-xl object-cover" />}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`chip ${r.open ? 'bg-flame-100 text-flame-600' : 'bg-navy-50 text-navy-800'}`}>{r.open ? 'Aberto' : 'Encerrado'}</span>
              <span className="text-xs font-semibold text-navy-900">{r.ref}</span>
            </div>
            <p className="mt-1 font-bold text-navy-900">{r.name}</p>
            <p className="flex flex-wrap gap-x-3 text-xs text-muted">
              <span>{categoryLabel(r.category)}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{r.location}</span>
              <span className="inline-flex items-center gap-1"><Calendar className="size-3" />{formatDate(r.dateLost)}</span>
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" loading={busyId === r.id} onClick={() => run(r.id, () => setMyReportOpen(r.id, !r.open), r.open ? 'Relato encerrado.' : 'Relato reaberto.')}>
              {r.open ? 'Encerrar' : 'Reabrir'}
            </Button>
            <Button variant="danger" disabled={busyId === r.id} onClick={() => window.confirm('Excluir este relato definitivamente?') && run(r.id, () => deleteMyReport(r), 'Relato excluído.')}>
              Excluir
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
