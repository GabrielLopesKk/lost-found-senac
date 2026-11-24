// @ts-nocheck
import { useState } from 'react'
import { Link } from '@/app/lib/router-compat'
import { supabase, authRedirectUrl, rememberNextPath } from '../lib/supabase'
import AuthCard, { FormError } from '../components/AuthCard'
import { Button, Field } from '../components/ui'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    rememberNextPath('/redefinir-senha')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: authRedirectUrl() })
    setBusy(false)
    // Resposta genérica: não revela se o e-mail tem cadastro.
    if (err && (err.status === 429 || err.code?.startsWith('over_'))) return setError('Muitas tentativas. Aguarde alguns minutos e tente de novo.')
    setSent(true)
  }

  return (
    <AuthCard eyebrow="Recuperar acesso" title="Esqueceu a senha?" subtitle="Informe seu e-mail e enviaremos um link para criar uma nova senha."
      footer={<Link to="/entrar" className="font-semibold text-flame-600 underline">Voltar para o login</Link>}>
      {sent ? (
        <p className="rounded-xl bg-flame-50 p-4 text-sm text-navy-900">Se houver uma conta para <strong>{email.trim()}</strong>, você receberá um e-mail com o link em alguns minutos.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="E-mail" required>
            <input type="email" className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <FormError>{error}</FormError>
          <Button type="submit" loading={busy} disabled={!email.includes('@')} className="w-full">Enviar link</Button>
        </form>
      )}
    </AuthCard>
  )
}
