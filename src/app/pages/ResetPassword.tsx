// @ts-nocheck
import { useState } from 'react'
import { Link, useNavigate } from '@/app/lib/router-compat'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import AuthCard, { FormError } from '../components/AuthCard'
import { Button, Field, Spinner, useToast } from '../components/ui'

export default function ResetPassword() {
  const { user, loading, clearRecovery } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (loading) return <Spinner />
  if (!user) {
    return (
      <AuthCard eyebrow="Link expirado" title="Não foi possível validar o link">
        <p className="text-sm text-muted">O link de redefinição é válido por pouco tempo e só pode ser usado uma vez.</p>
        <Link to="/recuperar-senha" className="mt-4 inline-block font-semibold text-flame-600 underline">Pedir um novo link</Link>
      </AuthCard>
    )
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('Use pelo menos 8 caracteres.')
    if (password !== confirm) return setError('As senhas não coincidem.')
    setBusy(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (err) {
      if (err.code === 'weak_password') return setError('Senha fraca. Misture letras e números.')
      if (err.code === 'same_password') return setError('A nova senha precisa ser diferente da anterior.')
      return setError('Não foi possível salvar a nova senha. Tente novamente.')
    }
    clearRecovery()
    toast('Senha atualizada com sucesso.')
    navigate('/minha-conta', { replace: true })
  }

  return (
    <AuthCard eyebrow="Nova senha" title="Defina sua nova senha">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Nova senha" required>
          <input type="password" className="input" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Confirmar nova senha" required>
          <input type="password" className="input" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <FormError>{error}</FormError>
        <Button type="submit" loading={busy} className="w-full">Salvar senha</Button>
      </form>
    </AuthCard>
  )
}
