// @ts-nocheck
import { useState } from 'react'
import { Link } from '@/app/lib/router-compat'
import useSWR from 'swr'
import { Ticket, KeyRound, Copy } from 'lucide-react'
import { listMyClaims, cancelMyClaim, issuePickupCode } from '../../data/api'
import { CLAIM_STATUS } from '../../data/constants'
import { formatDate } from '../../lib/format'
import { useAuth } from '../../auth/AuthProvider'
import { Button, EmptyState, Modal, Spinner, useToast } from '../ui'

const CLAIM_STYLE = {
  [CLAIM_STATUS.PENDENTE]: 'bg-flame-100 text-flame-600',
  [CLAIM_STATUS.APROVADA]: 'bg-emerald-100 text-emerald-800',
  [CLAIM_STATUS.RECUSADA]: 'bg-red-50 text-red-700',
}

export default function MyClaims() {
  const { user } = useAuth()
  const toast = useToast()
  const { data, error, isLoading, mutate } = useSWR(['my-claims', user.id], listMyClaims)
  const [busyId, setBusyId] = useState(null)
  const [code, setCode] = useState(null)

  async function run(id, fn) {
    setBusyId(id)
    try { await fn() } catch (err) { toast(err.message, 'error') } finally { setBusyId(null) }
  }

  const generate = (claim) => run(claim.id, async () => {
    const value = await issuePickupCode(claim.id)
    setCode({ value, claim })
    mutate()
  })
  const cancel = (claim) => run(claim.id, async () => {
    await cancelMyClaim(claim.id)
    toast('Solicitação cancelada.')
    mutate()
  })

  if (isLoading) return <Spinner />
  if (error) return <EmptyState icon={Ticket} title="Algo deu errado">{error.message}</EmptyState>
  if (!data.length) {
    return (
      <EmptyState icon={Ticket} title="Nenhuma solicitação ainda">
        Encontrou algo seu? Abra o objeto em <Link to="/procurar" className="font-semibold text-flame-600 underline">Procurar</Link> e clique em “Tenho interesse”.
      </EmptyState>
    )
  }

  return (
    <>
      <ul className="space-y-3">
        {data.map((c) => (
          <li key={c.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`chip ${CLAIM_STYLE[c.status]}`}>{c.status}</span>
                <span className="text-xs text-muted">{c.ref} · {formatDate(c.createdAt.slice(0, 10))}</span>
              </div>
              <p className="mt-1 font-bold text-navy-900">{c.itemName}</p>
              <p className="text-sm text-muted">
                {c.codeUsed ? `Retirado em ${formatDate(c.pickedUpAt?.slice(0, 10))}.`
                  : c.status === CLAIM_STATUS.APROVADA ? (c.codeIssuedAt ? 'Código já gerado. Gere outro se perdeu o anterior.' : 'Aprovada! Gere seu código e leve-o à recepção.')
                  : c.status === CLAIM_STATUS.PENDENTE ? 'A recepção está conferindo sua prova de posse.'
                  : 'A recepção não confirmou a posse.'}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {c.status === CLAIM_STATUS.APROVADA && !c.codeUsed && (
                <Button onClick={() => generate(c)} loading={busyId === c.id}><KeyRound className="size-4" /> {c.codeIssuedAt ? 'Gerar novo código' : 'Gerar código'}</Button>
              )}
              {c.status === CLAIM_STATUS.PENDENTE && (
                <Button variant="danger" onClick={() => cancel(c)} loading={busyId === c.id}>Cancelar</Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <Modal open={!!code} onClose={() => setCode(null)} title="Seu código de retirada">
        {code && (
          <div className="text-center">
            <p className="text-sm text-muted">Apresente este código na recepção junto com um documento com foto. Ele é exibido só agora e vale para um único uso.</p>
            <p className="my-5 rounded-2xl bg-navy-900 py-5 font-display text-4xl font-extrabold tracking-[0.2em] text-white">{code.value}</p>
            <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(code.value); toast('Código copiado.') }}><Copy className="size-4" /> Copiar código</Button>
          </div>
        )}
      </Modal>
    </>
  )
}
