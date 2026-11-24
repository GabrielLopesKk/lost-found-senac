// @ts-nocheck
import { Link } from '@/app/lib/router-compat'
import { PackageSearch } from 'lucide-react'
import { EmptyState } from '../components/ui'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <EmptyState icon={PackageSearch} title="Página não encontrada">
        Parece que esta página também se perdeu. <Link to="/" className="font-semibold text-flame-600 underline">Voltar ao início</Link>
      </EmptyState>
    </div>
  )
}
