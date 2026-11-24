// @ts-nocheck
import { useState } from 'react'
import { CircleCheck } from 'lucide-react'
import { validatePickupCode } from '../../data/api'
import { FormError } from '../AuthCard'
import { Button, Field } from '../ui'
import { useAction } from './useAction'

export default function ValidatePanel({ refresh }) {
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { run } = useAction(refresh)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setResult(null)
    setBusy(true)
    try {
      const res = await validatePickupCode(code)
      setResult(res)
      setCode('')
      await run('refresh', async () => {})
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card max-w-lg p-6">
      <h2 className="text-lg font-bold text-navy-900">Validar código de retirada</h2>
      <p className="mt-1 text-sm text-muted">Confira um documento com foto antes de entregar. Cada código vale uma única vez.</p>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <Field label="Código" required>
          <input className="input text-center font-display text-2xl uppercase tracking-[0.2em]" placeholder="XXXX-XXXX" maxLength={9}
            value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} autoComplete="off" />
        </Field>
        <FormError>{error}</FormError>
        <Button type="submit" loading={busy} disabled={code.replace(/[^A-Z0-9]/g, '').length !== 8} className="w-full">Validar e registrar devolução</Button>
      </form>
      {result && (
        <div role="status" className="mt-4 flex gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
          <CircleCheck className="size-5 shrink-0" />
          <p>Código válido. Entregue <strong>{result.itemName}</strong> ({result.itemRef}) para <strong>{result.claimant}</strong>. O objeto foi marcado como devolvido.</p>
        </div>
      )}
    </div>
  )
}
