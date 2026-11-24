// @ts-nocheck
import { useId, useState } from 'react'
import { ImagePlus, LoaderCircle, Trash2, Sparkles } from 'lucide-react'
import { CATEGORIES, COLORS, LOCATIONS } from '../data/constants'
import { reencodeImage } from '../lib/imageTools'
import { analyzePhotoSmart } from '../lib/analyzePhoto'
import { Field } from './ui'

export const todayISO = () => new Date().toLocaleDateString('sv-SE')
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function validateItemFields(v, dateKey) {
  const e = {}
  if (!v.name || v.name.trim().length < 2) e.name = 'Informe um nome com pelo menos 2 letras.'
  else if (v.name.trim().length > 80) e.name = 'Use no máximo 80 caracteres.'
  if (!v.category) e.category = 'Escolha uma categoria.'
  if (!v.color) e.color = 'Escolha a cor principal.'
  if (!v.location) e.location = 'Escolha o local.'
  if (!v[dateKey]) e[dateKey] = 'Informe a data.'
  else if (v[dateKey] > todayISO()) e[dateKey] = 'A data não pode estar no futuro.'
  const d = (v.description || '').trim()
  if (d.length < 10) e.description = 'Descreva com pelo menos 10 caracteres.'
  else if (d.length > 600) e.description = 'Use no máximo 600 caracteres.'
  return e
}

export function validateContact({ contactEmail, contactPhone }) {
  const e = {}
  const email = (contactEmail || '').trim()
  const phone = (contactPhone || '').replace(/\D/g, '')
  if (!email && !phone) e.contactEmail = 'Informe pelo menos um contato.'
  if (email && !EMAIL_RE.test(email)) e.contactEmail = 'E-mail inválido.'
  if (phone && (phone.length < 10 || phone.length > 11)) e.contactPhone = 'Use DDD + número (10 ou 11 dígitos).'
  return e
}

export function ItemFields({ values, errors, set, dateKey, dateLabel, descriptionHint }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="Nome do objeto" required error={errors.name}>
          <input className="input" value={values.name} onChange={(e) => set('name', e.target.value)} maxLength={80} placeholder="Ex.: Garrafa térmica azul" />
        </Field>
      </div>
      <Field label="Categoria" required error={errors.category}>
        <select className="input" value={values.category} onChange={(e) => set('category', e.target.value)}>
          <option value="">Selecione…</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </Field>
      <Field label="Local" required error={errors.location}>
        <select className="input" value={values.location} onChange={(e) => set('location', e.target.value)}>
          <option value="">Selecione…</option>
          {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
        </select>
      </Field>
      <div className="sm:col-span-2">
        <span className="label">Cor principal <span className="text-flame-600">*</span></span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cor principal">
          {COLORS.map((c) => (
            <button key={c.id} type="button" role="radio" aria-checked={values.color === c.id} title={c.label} aria-label={c.label}
              onClick={() => set('color', c.id)}
              className={`size-8 rounded-full ring-1 ring-black/10 transition hover:scale-110 ${values.color === c.id ? 'ring-4 ring-flame-500 ring-offset-2' : ''}`}
              style={{ background: c.hex }} />
          ))}
        </div>
        {errors.color && <span className="mt-1 block text-xs font-medium text-red-600">{errors.color}</span>}
      </div>
      <Field label={dateLabel} required error={errors[dateKey]}>
        <input type="date" className="input" max={todayISO()} value={values[dateKey]} onChange={(e) => set(dateKey, e.target.value)} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Descrição" required error={errors.description} hint={descriptionHint}>
          <textarea className="input min-h-28" maxLength={600} value={values.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
      </div>
    </div>
  )
}

export function PhotoPicker({ value, onChange, onAnalyzed, hint }) {
  const id = useId()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setBusy(true)
    try {
      const { dataUrl } = await reencodeImage(file)
      onChange(dataUrl)
      if (onAnalyzed) {
        try { onAnalyzed(await analyzePhotoSmart(dataUrl, file.name)) } catch { /* sugestões são opcionais */ }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <span className="label">Foto (opcional)</span>
      {value ? (
        <div className="relative overflow-hidden rounded-2xl border border-line">
          <img src={value} alt="Pré-visualização da foto selecionada" className="max-h-72 w-full bg-navy-50 object-contain" />
          <button type="button" onClick={() => onChange(null)} className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-red-700 shadow">
            <Trash2 className="size-3.5" /> Remover
          </button>
        </div>
      ) : (
        <label htmlFor={id} className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-navy-50/50 px-4 py-8 text-center transition hover:border-flame-400 hover:bg-flame-50">
          {busy ? <LoaderCircle className="size-7 animate-spin text-flame-500" /> : <ImagePlus className="size-7 text-navy-700" />}
          <span className="text-sm font-semibold text-navy-900">{busy ? 'Processando imagem…' : 'Escolher ou tirar uma foto'}</span>
          <span className="text-xs text-muted">JPG, PNG ou WEBP até 8 MB. Removemos a localização (GPS) da foto.</span>
        </label>
      )}
      <input id={id} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleFile} />
      {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  )
}

export function SuggestionBox({ analysis, onApply }) {
  if (!analysis) return null
  return (
    <div className="rounded-2xl border border-flame-100 bg-flame-50 p-4 text-sm">
      <p className="flex items-center gap-2 font-semibold text-navy-900"><Sparkles className="size-4 text-flame-600" /> Sugestões a partir da foto</p>
      <p className="mt-1 text-muted">{analysis.note}</p>
      <ul className="mt-2 list-inside list-disc text-navy-900/80">
        {analysis.characteristics.map((c) => <li key={c}>{c}</li>)}
      </ul>
      <button type="button" onClick={onApply} className="mt-3 text-sm font-semibold text-flame-600 underline">Aplicar cor e categoria sugeridas</button>
    </div>
  )
}
