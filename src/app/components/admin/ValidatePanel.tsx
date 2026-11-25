// @ts-nocheck
import { useRef, useState } from 'react'
import { useSWRConfig } from 'swr'
import { CircleCheck } from 'lucide-react'
import { validatePickupCode } from '../../data/api'
import { FormError } from '../AuthCard'
import { Button, Field } from '../ui'

export default function ValidatePanel({ refresh }) {
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  const { mutate } = useSWRConfig()
  const [refreshError, setRefreshError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (submitting.current) return
    submitting.current = true
    setError('')
    setResult(null)
    setRefreshError('')
    setBusy(true)
    try {
      const res = await validatePickupCode(code)
      setResult(res)
      setCode('')
      // A refresh failure must never turn a completed withdrawal into a failure.
      try {
        await Promise.all([
          refresh(),
          mutate((key) => Array.isArray(key) && ['public', 'my-claims', 'my-items'].includes(key[0])),
        ])
      } catch {
        setRefreshError('A retirada foi registrada, mas não foi possível atualizar as outras listas agora.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível validar o código. Tente novamente.')
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return (
    <div className="card max-w-lg p-6">
      <h2 className="text-lg font-bold text-navy-900">Validar código de retirada</h2>
      <p className="mt-1 text-sm text-muted">Confira um documento com foto antes de entregar. Cada código vale uma única vez.</p>
      <form onSubmit={submit} className="mt-4 space-y-4" aria-busy={busy}>
        <Field label="Código" required>
          <input className="input text-center font-display text-2xl uppercase tracking-[0.2em]" placeholder="XXXX-XXXX"
            value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} disabled={busy} autoComplete="off" spellCheck={false} />
        </Field>
        <FormError>{error}</FormError>
        <Button type="submit" loading={busy} className="w-full">Validar e registrar devolução</Button>
      </form>
      {result && (
        <div role="status" className="mt-4 flex gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
          <CircleCheck className="size-5 shrink-0" />
          <p>Retirada validada com sucesso. Entregue <strong>{result.itemName}</strong> ({result.itemRef}) para <strong>{result.claimant}</strong>. O objeto foi marcado como devolvido.</p>
        </div>
      )}
      {refreshError && <p role="status" className="mt-3 text-sm text-muted">{refreshError}</p>}
    </div>
  )
}
