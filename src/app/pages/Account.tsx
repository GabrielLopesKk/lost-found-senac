// @ts-nocheck
import { useState } from 'react'
import { Link } from '@/app/lib/router-compat'
import { UserRound, Ticket, ClipboardList, HandHeart } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import ProfileCard from '../components/account/ProfileCard'
import MyClaims from '../components/account/MyClaims'
import MyReports from '../components/account/MyReports'
import MyFoundItems from '../components/account/MyFoundItems'

const TABS = [
  { id: 'claims', label: 'Solicitações', icon: Ticket, Component: MyClaims },
  { id: 'reports', label: 'Meus relatos', icon: ClipboardList, Component: MyReports },
  { id: 'found', label: 'Objetos que registrei', icon: HandHeart, Component: MyFoundItems },
  { id: 'profile', label: 'Perfil', icon: UserRound, Component: ProfileCard },
]

export default function Account() {
  const { profile, user, isStaff } = useAuth()
  const [tab, setTab] = useState('claims')
  const Active = TABS.find((t) => t.id === tab).Component

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-flame-600">Minha conta</p>
          <h1 className="mt-1 text-3xl font-extrabold text-navy-900">Olá, {profile?.fullName?.split(' ')[0] || 'tudo bem'}?</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
        {isStaff && <Link to="/admin" className="text-sm font-semibold text-flame-600 underline">Ir para a administração</Link>}
      </header>
      <div role="tablist" aria-label="Seções da conta" className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-line bg-white p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === id ? 'bg-navy-900 text-white' : 'text-navy-900/80 hover:bg-navy-50'}`}>
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>
      <div role="tabpanel"><Active /></div>
    </div>
  )
}
