// @ts-nocheck
import { useState } from 'react'
import { Link } from '@/app/lib/router-compat'
import { updateMyProfile } from '../../data/api'
import { useAuth } from '../../auth/AuthProvider'
import { FormError } from '../AuthCard'
import { Button, Field, useToast } from '../ui'

export default function ProfileCard() {
  const { profile, refreshProfile } = useAuth()
  const toast = useToast()
  const [fullName, setFullName] = useState(profile?.fullName || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    const digits = phone.replace(/\D/g, '')
    if (fullName.trim().length < 2) return setError('Informe seu nome.')
    if (digits && (digits.length < 10 || digits.length > 11)) return setError('Telefone: use DDD + número (10 ou 11 dígitos).')
    setBusy(true)
    try {
      await updateMyProfile({ fullName, phone: digits })
    } catch (err) {
      setError(err.message)
      setBusy(false)
      return
    }
    toast('Perfil atualizado.')
    try { await refreshProfile() } catch { toast('Perfil salvo, mas não foi possível atualizar a tela agora.', 'error') }
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className="card max-w-xl space-y-4 p-6" noValidate>
      <Field label="Nome completo" required>
        <input className="input" maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </Field>
      <Field label="Telefone" hint="Usado para preencher seus relatos e solicitações.">
        <input type="tel" inputMode="numeric" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      <FormError>{error}</FormError>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="submit" loading={busy}>Salvar alterações</Button>
        <Link to="/recuperar-senha" className="text-sm font-semibold text-navy-800 hover:text-flame-600">Trocar senha</Link>
      </div>
    </form>
  )
}
