// @ts-nocheck
import { Link } from '@/app/lib/router-compat'
import { Smartphone, IdCard, KeyRound, CupSoda, Shirt, Backpack, NotebookPen, Glasses, Package, MapPin, Calendar, EyeOff } from 'lucide-react'
import { categoryLabel, colorOf, STATUS } from '../data/constants'
import { formatDate, relativeDays } from '../lib/format'

export const CATEGORY_ICONS = { eletronicos: Smartphone, documentos: IdCard, chaves: KeyRound, garrafas: CupSoda, roupas: Shirt, bolsas: Backpack, material: NotebookPen, acessorios: Glasses, outros: Package }

const STATUS_STYLE = {
  [STATUS.ENCONTRADO]: 'bg-flame-100 text-flame-600',
  [STATUS.AGUARDANDO]: 'bg-navy-100 text-navy-800',
  [STATUS.DEVOLVIDO]: 'bg-emerald-100 text-emerald-800',
}

export function StatusBadge({ status }) {
  return <span className={`chip ${STATUS_STYLE[status] ?? 'bg-navy-50 text-navy-800'}`}><span className="size-1.5 rounded-full bg-current" />{status}</span>
}

export function ColorDot({ color, withLabel }) {
  const c = colorOf(color)
  if (!c) return null
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span className="size-3 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} />
      {withLabel && c.label}
    </span>
  )
}

export function ItemThumb({ item, className = '' }) {
  const Icon = CATEGORY_ICONS[item.category] ?? Package
  if (item.photo) return <img src={item.photo} alt={item.name} className={`h-full w-full object-cover ${className}`} loading="lazy" />
  const tint = colorOf(item.color)?.hex ?? '#e3eaf4'
  return (
    <div className={`relative grid h-full w-full place-items-center overflow-hidden bg-navy-50 ${className}`}>
      <div className="absolute -right-6 -top-6 size-28 rounded-full opacity-25" style={{ background: tint }} />
      <div className="absolute -bottom-8 -left-4 size-20 rounded-full bg-flame-500/10" />
      <Icon className="relative size-12 text-navy-700/70" strokeWidth={1.5} />
      {item.photoHidden && (
        <span className="chip absolute bottom-2 left-2 bg-white/90 text-navy-800"><EyeOff className="size-3" /> Foto restrita</span>
      )}
    </div>
  )
}

export function ItemCard({ item, style }) {
  return (
    <Link to={`/objeto/${item.id}`} style={style} className="card rise group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(11,37,69,0.35)]">
      <div className="aspect-[4/3] overflow-hidden">
        <div className="h-full transition duration-500 group-hover:scale-105"><ItemThumb item={item} /></div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">{categoryLabel(item.category)}</span>
          <StatusBadge status={item.status} />
        </div>
        <h3 className="text-base font-bold leading-snug text-navy-900">{item.name}</h3>
        <p className="line-clamp-2 text-sm text-muted">{item.description}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{item.location}</span>
          <span className="inline-flex items-center gap-1" title={formatDate(item.dateFound)}><Calendar className="size-3.5" />{relativeDays(item.dateFound)}</span>
          <ColorDot color={item.color} />
        </div>
      </div>
    </Link>
  )
}
