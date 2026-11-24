// @ts-nocheck
import { useState } from 'react'
import { Boxes, Eye, EyeOff } from 'lucide-react'
import { updateItem } from '../../data/api'
import { STATUS } from '../../data/constants'
import { formatDate, normalize } from '../../lib/format'
import { ItemThumb, StatusBadge } from '../ItemBits'
import { EmptyState } from '../ui'
import { useAction } from './useAction'

export default function ItemsPanel({ data, refresh }) {
  const [q, setQ] = useState('')
  const { busy, run } = useAction(refresh)
  const term = normalize(q)
  const list = data.items.filter((i) => !term || normalize(`${i.name} ${i.ref} ${i.location}`).includes(term))

  return (
    <div>
      <label className="mb-4 block max-w-sm">
        <span className="sr-only">Filtrar objetos</span>
        <input className="input" placeholder="Filtrar por nome, código ou local…" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      {list.length === 0 ? <EmptyState icon={Boxes} title="Nenhum objeto">Nada encontrado com esse filtro.</EmptyState> : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-navy-50 text-left text-xs uppercase tracking-wider text-muted">
              <tr><th className="p-3">Objeto</th><th className="p-3">Encontrado</th><th className="p-3">Status</th><th className="p-3">Visibilidade</th><th className="p-3 text-right">Ações</th></tr>
            </thead>
            <tbody>
              {list.map((i) => (
                <tr key={i.id} className="border-t border-line align-middle">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="size-12 shrink-0 overflow-hidden rounded-lg"><ItemThumb item={i} /></div>
                      <div><p className="font-semibold text-navy-900">{i.name}</p><p className="text-xs text-muted">{i.ref}{i.claimCount ? ` · ${i.claimCount} solicitação(ões)` : ''}</p></div>
                    </div>
                  </td>
                  <td className="p-3 text-muted">{formatDate(i.dateFound)}<br />{i.location}</td>
                  <td className="p-3">
                    <label className="sr-only" htmlFor={`st-${i.id}`}>Status de {i.name}</label>
                    <select id={`st-${i.id}`} className="input py-1.5" value={i.status} disabled={busy === i.id}
                      onChange={(e) => run(i.id, () => updateItem(i.id, { status: e.target.value }), 'Status atualizado.')}>
                      {Object.values(STATUS).map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-xs">
                    {i.hidden ? <span className="chip bg-navy-50 text-navy-800">Oculto</span>
                      : i.autoHidden ? <span className="chip bg-navy-50 text-navy-800">Expirado (+90 dias)</span>
                      : i.status === STATUS.DEVOLVIDO ? <span className="chip bg-navy-50 text-navy-800">Fora da lista</span>
                      : <StatusBadge status="Público" />}
                    {i.sensitive && <span className="chip ml-1 bg-red-50 text-red-700">Foto restrita</span>}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-navy-900 ring-1 ring-line hover:bg-navy-50 disabled:opacity-50" disabled={busy === i.id}
                        onClick={() => run(i.id, () => updateItem(i.id, { sensitive: !i.sensitive }), i.sensitive ? 'Foto liberada.' : 'Foto restrita.')}>
                        {i.sensitive ? 'Liberar foto' : 'Restringir foto'}
                      </button>
                      <button className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-navy-900 ring-1 ring-line hover:bg-navy-50 disabled:opacity-50" disabled={busy === i.id}
                        onClick={() => run(i.id, () => updateItem(i.id, { hidden: !i.hidden }), i.hidden ? 'Objeto visível.' : 'Objeto ocultado.')}>
                        {i.hidden ? <><Eye className="size-3.5" /> Mostrar</> : <><EyeOff className="size-3.5" /> Ocultar</>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
