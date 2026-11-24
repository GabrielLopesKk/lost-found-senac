// @ts-nocheck
import { useState } from 'react'
import { Link, Navigate, useSearchParams } from '@/app/lib/router-compat'
import { useAuth } from '../auth/AuthProvider'
import { takeNextPath } from '../lib/supabase'
import AuthCard from '../components/AuthCard'
import { Spinner } from '../components/ui'

// O cliente Supabase troca o ?code= pela sessão automaticamente ao iniciar.
export default function AuthCallback() {
  const { user, loading, recovery } = useAuth()
  const [params] = useSearchParams()
  const [next] = useState(() => takeNextPath())
  const providerError = params.get('error_description')

  if (loading) return <Spinner label="Confirmando seu acesso…" />
  if (user) return <Navigate to={recovery ? '/redefinir-senha' : next || '/minha-conta'} replace />

  return (
    <AuthCard eyebrow="Acesso" title="Não conseguimos concluir o login">
      <p className="text-sm text-muted">
        {providerError ? 'O link é inválido ou expirou.' : 'Se você acabou de confirmar seu e-mail, sua conta já está ativa — basta entrar com sua senha.'}
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
        <Link to="/entrar" className="text-flame-600 underline">Entrar</Link>
        <Link to="/recuperar-senha" className="text-navy-800 underline">Pedir novo link de senha</Link>
      </div>
    </AuthCard>
  )
}
