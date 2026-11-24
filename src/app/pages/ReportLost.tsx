// @ts-nocheck
import { useState } from 'react'
import { Link } from '@/app/lib/router-compat'
import { useSWRConfig } from 'swr'
import { ClipboardCheck, Sparkles } from 'lucide-react'
import { createLostReport } from '../data/api'
import { useAuth } from '../auth/AuthProvider'
import { ItemFields, PhotoPicker, validateItemFields, validateContact, todayISO } from '../components/forms'
import { ItemCard } from '../components/ItemBits'
import { FormError } from '../components/AuthCard'
import { Button, Field, useToast } from '../components/ui'

export default function ReportLost() {
  const { user, profile } = useAuth()
  const toast = useToast()
  const { mutate } = useSWRConfig()
  const blank = () => ({
    name: '', category: '', color: '', location: '', dateLost: todayISO(), description: '', photo: null,
    contactEmail: user?.email || '', contactPhone: profile?.phone || '',
  })
  const [values, setValues] = useState(blank)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const set = (k, v) => setValues((s) => ({ ...s, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    setError('')
    const errs = { ...validateItemFields(values, 'dateLost'), ...validateContact(values) }
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      const res = await createLostReport(values)
      mutate(['my-reports', user.id])
      mutate(['public', 'stats'])
      toast(`Relato ${res.ref} registrado.`)
      setResult(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="card rise flex flex-col items-center p-8 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-flame-50 text-flame-600"><ClipboardCheck className="size-7" /></div>
          <h1 className="mt-4 text-2xl font-extrabold text-navy-900">Relato registrado</h1>
          <p className="mt-2 text-sm text-muted">Seu protocolo é</p>
          <p className="mt-1 font-display text-3xl font-extrabold tracking-wider text-navy-900">{result.ref}</p>
          <p className="mt-2 max-w-md text-sm text-muted">Acompanhe em <Link to="/minha-conta" className="font-semibold text-flame-600 underline">Minha conta</Link>. A recepção é avisada quando algo parecido aparecer.</p>
          <Button variant="outline" className="mt-5" onClick={() => { setResult(null); setValues(blank()) }}>Registrar outro relato</Button>
        </div>
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-navy-900"><Sparkles className="size-5 text-flame-600" /> Possíveis correspondências</h2>
          {result.matches.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Nenhum objeto parecido por enquanto. Volte a procurar nos próximos dias.</p>
          ) : (
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {result.matches.map((m) => (
                <div key={m.item.id} className="flex flex-col gap-2">
                  <ItemCard item={m.item} />
                  <p className="text-xs text-muted"><strong className="text-navy-900">{m.score}% compatível</strong> · {m.reasons.slice(0, 2).join(' · ')}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-flame-600">Perdi algo</p>
        <h1 className="mt-1 text-3xl font-extrabold text-navy-900 sm:text-4xl">Criar relato de perda</h1>
        <p className="mt-2 text-muted">Você recebe um protocolo e sugestões de objetos parecidos já encontrados.</p>
      </header>
      <form onSubmit={submit} className="card space-y-6 p-6 sm:p-8" noValidate>
        <ItemFields values={values} errors={errors} set={set} dateKey="dateLost" dateLabel="Data em que perdeu"
          descriptionHint="Quanto mais detalhes, melhores as sugestões. Esses dados ficam visíveis só para você e a recepção." />
        <PhotoPicker value={values.photo} onChange={(p) => set('photo', p)} hint="Uma foto antiga do objeto ajuda a recepção a reconhecê-lo." />
        <div>
          <p className="label">Como falar com você</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="E-mail" error={errors.contactEmail}>
              <input type="email" className="input" value={values.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
            </Field>
            <Field label="Telefone" error={errors.contactPhone}>
              <input type="tel" inputMode="numeric" className="input" value={values.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
            </Field>
          </div>
        </div>
        <FormError>{error}</FormError>
        <Button type="submit" loading={busy} className="w-full py-3">Registrar relato</Button>
      </form>
    </div>
  )
}
