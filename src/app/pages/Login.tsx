// @ts-nocheck
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from '@/app/lib/router-compat'
import { supabase, authRedirectUrl } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import AuthCard, { FormError } from '../components/AuthCard'
import { Button, Field } from '../components/ui'

function loginError(error) {
  if (error.code === 'email_not_confirmed') return { text: 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.', unconfirmed: true }
  if (error.status === 429 || error.code === 'over_request_rate_limit') return { text: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' }
  if (error.code === 'invalid_credentials' || error.status === 400) return { text: 'E-mail ou senha inválidos.' }
  return { text: 'Não foi possível entrar agora. Tente novamente em instantes.' }
}

export default function Login() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/minha-conta'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [resent, setResent] = useState(false)

  if (!loading && user) return <Navigate to={from} replace />

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (err) return setError(loginError(err))
    navigate(from, { replace: true })
  }

  async function resend() {
    await supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: authRedirectUrl() } })
    setResent(true)
  }

  return (
    <AuthCard eyebrow="Entrar" title="Bem-vindo de volta" subtitle="Entre para registrar objetos, criar relatos e acompanhar suas solicitações."
      footer={<>Ainda não tem conta? <Link to="/cadastro" state={location.state} className="font-semibold text-flame-600 underline">Criar conta</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="E-mail" required>
          <input type="email" className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Senha" required>
          <input type="password" className="input" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <div className="flex justify-end">
          <Link to="/recuperar-senha" className="text-sm font-semibold text-navy-800 hover:text-flame-600">Esqueci minha senha</Link>
        </div>
        <FormError>
          {error?.text}
          {error?.unconfirmed && (resent
            ? <span className="mt-1 block">Enviamos um novo link de confirmação.</span>
            : <button type="button" onClick={resend} className="mt-1 block font-semibold underline">Reenviar e-mail de confirmação</button>)}
        </FormError>
        <Button type="submit" loading={busy} disabled={!email || !password} className="w-full">Entrar</Button>
      </form>
    </AuthCard>
  )
}
