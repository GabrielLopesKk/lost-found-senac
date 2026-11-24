// @ts-nocheck
import { Navigate, useLocation, Link } from '@/app/lib/router-compat'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { Spinner, EmptyState } from '../components/ui'

export default function RequireAuth({ children, staff = false }) {
  const { user, isStaff, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner label="Verificando sua sessão…" />
  if (!user) return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />
  if (staff && !isStaff) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <EmptyState icon={ShieldAlert} title="Área restrita à recepção">
          Sua conta não tem permissão de administração. Se você faz parte da equipe, peça para um responsável liberar seu acesso.{' '}
          <Link to="/" className="font-semibold text-flame-600 underline">Voltar ao início</Link>
        </EmptyState>
      </div>
    )
  }
  return children
}
