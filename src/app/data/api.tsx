// @ts-nocheck
// Camada de acesso a dados — Supabase.
//
// Todas as telas falam SOMENTE com estas funções. A segurança real está no
// banco (RLS + funções RPC): este arquivo só traduz linhas <-> objetos da UI.
import { supabase, PHOTO_BUCKET } from '../lib/supabase'
import { AUTO_HIDE_DAYS, STATUS } from './constants'
import { daysSince, maskEmail, maskPhone, normalize } from '../lib/format'
import { findMatches } from '../lib/matching'

const SIGNED_URL_TTL = 60 * 60
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const PUBLIC_ITEM_COLS = 'id, ref, name, category, color, location, date_found, description, marks, status, photo_path, photo_hidden, created_at'
const ITEM_COLS = 'id, ref, name, category, color, location, date_found, description, marks, status, sensitive, hidden, photo_path, reported_by, created_at'
const REPORT_COLS = 'id, ref, user_id, name, category, color, location, date_lost, description, contact_email, contact_phone, photo_path, is_open, created_at'
const CLAIM_COLS = 'id, ref, item_id, user_id, name, contact_email, contact_phone, proof, status, code_used, code_issued_at, decided_at, picked_up_at, created_at'

// ---------- Utilidades ----------
function friendlyMessage(error, fallback) {
  if (!error) return fallback
  if (error.code === 'P0001') return error.message // mensagens das funções do banco
  if (error.code === '23505') return 'Você já tem uma solicitação ativa para este objeto.'
  if (error.code === '23514') return 'Alguns dados são inválidos. Revise o formulário.'
  if (error.code === '42501') return 'Você não tem permissão para esta ação.'
  return fallback
}
function check(error, fallback) {
  if (error) throw new Error(friendlyMessage(error, fallback))
}

async function requireUserId() {
  const { data } = await supabase.auth.getSession()
  const id = data.session?.user?.id
  if (!id) throw new Error('Faça login para continuar.')
  return id
}

async function signPhotos(paths) {
  const unique = [...new Set(paths.filter(Boolean))]
  if (!unique.length) return {}
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(unique, SIGNED_URL_TTL)
  if (error || !data) return {}
  return Object.fromEntries(data.filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]))
}

async function uploadPhoto(dataUrl) {
  if (!dataUrl) return null
  const userId = await requireUserId()
  const blob = await (await fetch(dataUrl)).blob()
  const path = `${userId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  check(error, 'Não foi possível enviar a foto. Tente novamente.')
  return path
}

async function removePhoto(path) {
  if (path) await supabase.storage.from(PHOTO_BUCKET).remove([path])
}

const cleanText = (s) => (s || '').trim()
const cleanPhone = (s) => (s || '').replace(/\D/g, '')

function toItem(row, urls = {}) {
  return {
    id: row.id,
    ref: row.ref,
    name: row.name,
    category: row.category,
    color: row.color,
    location: row.location,
    dateFound: row.date_found,
    description: row.description,
    marks: row.marks || [],
    status: row.status,
    sensitive: !!row.sensitive,
    hidden: !!row.hidden,
    photo: row.photo_path ? urls[row.photo_path] ?? null : null,
    photoHidden: !!row.photo_hidden,
    createdAt: row.created_at,
  }
}

function toReport(row, urls = {}) {
  return {
    id: row.id,
    ref: row.ref,
    name: row.name,
    category: row.category,
    color: row.color,
    location: row.location,
    dateLost: row.date_lost,
    description: row.description,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    photo: row.photo_path ? urls[row.photo_path] ?? null : null,
    open: row.is_open,
    createdAt: row.created_at,
  }
}

// ---------- Público ----------
export async function listPublicItems({ q = '', category = '', color = '', location = '', from = '', to = '' } = {}) {
  let query = supabase.from('public_items').select(PUBLIC_ITEM_COLS).order('date_found', { ascending: false }).limit(500)
  if (category) query = query.eq('category', category)
  if (color) query = query.eq('color', color)
  if (location) query = query.eq('location', location)
  if (from) query = query.gte('date_found', from)
  if (to) query = query.lte('date_found', to)
  const { data, error } = await query
  check(error, 'Não foi possível carregar os objetos.')

  // Busca textual sem acentos, feita aqui para aceitar "eletronico" = "eletrônico".
  const terms = normalize(q).split(/\s+/).filter(Boolean)
  const rows = terms.length
    ? data.filter((i) => {
        const hay = normalize(`${i.name} ${i.description} ${(i.marks || []).join(' ')} ${i.location}`)
        return terms.every((t) => hay.includes(t))
      })
    : data
  const urls = await signPhotos(rows.map((r) => r.photo_path))
  return rows.map((r) => toItem(r, urls))
}

export async function getPublicItem(id) {
  if (!UUID_RE.test(id || '')) return null
  const { data, error } = await supabase.from('public_items').select(PUBLIC_ITEM_COLS).eq('id', id).maybeSingle()
  check(error, 'Não foi possível carregar o objeto.')
  if (!data) return null
  const urls = await signPhotos([data.photo_path])
  return toItem(data, urls)
}

export async function getStats() {
  const { data, error } = await supabase.rpc('get_public_stats')
  check(error, 'Não foi possível carregar os números.')
  return data
}

// ---------- Usuário autenticado ----------
export async function createFoundItem(data) {
  const photoPath = await uploadPhoto(data.photo)
  const { data: row, error } = await supabase
    .from('items')
    .insert({
      name: cleanText(data.name),
      category: data.category,
      color: data.color,
      location: data.location,
      date_found: data.dateFound,
      description: cleanText(data.description),
      marks: (data.marks || []).map(cleanText).filter(Boolean).slice(0, 10),
      sensitive: !!data.sensitive,
      photo_path: photoPath,
    })
    .select('id, ref')
    .single()
  if (error) await removePhoto(photoPath)
  check(error, 'Não foi possível registrar o objeto.')
  return row
}

export async function createLostReport(data) {
  const photoPath = await uploadPhoto(data.photo)
  const payload = {
    name: cleanText(data.name),
    category: data.category,
    color: data.color,
    location: data.location,
    date_lost: data.dateLost,
    description: cleanText(data.description),
    contact_email: cleanText(data.contactEmail).toLowerCase(),
    contact_phone: cleanPhone(data.contactPhone),
    photo_path: photoPath,
  }
  const { data: row, error } = await supabase.from('lost_reports').insert(payload).select('id, ref').single()
  if (error) await removePhoto(photoPath)
  check(error, 'Não foi possível registrar o relato.')

  // Sugestões usam somente dados públicos; nunca expõem contato de ninguém.
  const pool = await listPublicItems()
  const lost = { ...payload, dateLost: payload.date_lost }
  const matches = findMatches(lost, pool, { min: 45, limit: 3 })
  return { ...row, matches }
}

export async function createClaim(itemId, { name, contactEmail, contactPhone, proof }) {
  const { data, error } = await supabase
    .from('claims')
    .insert({
      item_id: itemId,
      name: cleanText(name),
      contact_email: cleanText(contactEmail).toLowerCase(),
      contact_phone: cleanPhone(contactPhone),
      proof: cleanText(proof),
    })
    .select('id, ref')
    .single()
  if (error?.code === '42501') throw new Error('Este objeto não está mais disponível para solicitação.')
  check(error, 'Não foi possível enviar a solicitação.')
  return data
}

export async function getMyProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('id, full_name, phone').eq('id', userId).maybeSingle()
  const { data: staff } = await supabase.rpc('is_staff')
  if (data) data.role = staff ? 'staff' : 'user'
  check(error, 'Não foi possível carregar seu perfil.')
  return data ? { id: data.id, fullName: data.full_name, phone: data.phone, role: data.role } : null
}

export async function updateMyProfile({ fullName, phone }) {
  const userId = await requireUserId()
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: cleanText(fullName).slice(0, 120), phone: cleanPhone(phone).slice(0, 13) })
    .eq('id', userId)
  check(error, 'Não foi possível salvar seu perfil.')
}

export async function listMyClaims() {
  const { data, error } = await supabase.rpc('my_claims')
  check(error, 'Não foi possível carregar suas solicitações.')
  return data.map((c) => ({
    id: c.id,
    ref: c.ref,
    itemId: c.item_id,
    itemRef: c.item_ref,
    itemName: c.item_name,
    itemCategory: c.item_category,
    itemStatus: c.item_status,
    status: c.status,
    proof: c.proof,
    codeUsed: c.code_used,
    codeIssuedAt: c.code_issued_at,
    decidedAt: c.decided_at,
    pickedUpAt: c.picked_up_at,
    createdAt: c.created_at,
  }))
}

export async function cancelMyClaim(claimId) {
  const { error } = await supabase.from('claims').delete().eq('id', claimId)
  check(error, 'Não foi possível cancelar a solicitação.')
}

/** Gera um novo código de retirada (invalida o anterior). O banco guarda só o hash. */
export async function issuePickupCode(claimId) {
  const { data, error } = await supabase.rpc('issue_pickup_code', { p_claim_id: claimId })
  check(error, 'Não foi possível gerar o código.')
  return data
}

export async function listMyReports() {
  const userId = await requireUserId()
  const { data, error } = await supabase.from('lost_reports').select(REPORT_COLS).eq('user_id', userId).order('created_at', { ascending: false })
  check(error, 'Não foi possível carregar seus relatos.')
  const urls = await signPhotos(data.map((r) => r.photo_path))
  return data.map((r) => toReport(r, urls))
}

export async function setMyReportOpen(reportId, open) {
  const { error } = await supabase.from('lost_reports').update({ is_open: open }).eq('id', reportId)
  check(error, 'Não foi possível atualizar o relato.')
}

export async function deleteMyReport(report) {
  const { error } = await supabase.from('lost_reports').delete().eq('id', report.id)
  check(error, 'Não foi possível excluir o relato.')
}

export async function listMyFoundItems() {
  const userId = await requireUserId()
  const { data, error } = await supabase.from('items').select(ITEM_COLS).eq('reported_by', userId).order('created_at', { ascending: false })
  check(error, 'Não foi possível carregar seus registros.')
  const urls = await signPhotos(data.map((r) => r.photo_path))
  return data.map((r) => toItem(r, urls))
}

// ---------- Administração (recepção) ----------
// O banco recusa estas operações para quem não tem perfil "staff".
const maskContact = (x) => ({ ...x, contactEmail: maskEmail(x.contactEmail), contactPhone: maskPhone(x.contactPhone) })

export async function adminOverview() {
  const [itemsRes, claimsRes, reportsRes] = await Promise.all([
    supabase.from('items').select(ITEM_COLS).order('created_at', { ascending: false }).limit(1000),
    supabase.from('claims').select(CLAIM_COLS).order('created_at', { ascending: false }).limit(1000),
    supabase.from('lost_reports').select(REPORT_COLS).order('created_at', { ascending: false }).limit(1000),
  ])
  check(itemsRes.error || claimsRes.error || reportsRes.error, 'Não foi possível carregar o painel.')

  const urls = await signPhotos([...itemsRes.data, ...reportsRes.data].map((r) => r.photo_path))
  const rawItems = itemsRes.data.map((r) => toItem(r, urls))
  const byId = Object.fromEntries(rawItems.map((i) => [i.id, i]))
  const claims = claimsRes.data.map((c) =>
    maskContact({
      id: c.id,
      ref: c.ref,
      itemId: c.item_id,
      name: c.name,
      contactEmail: c.contact_email,
      contactPhone: c.contact_phone,
      proof: c.proof,
      status: c.status,
      codeUsed: c.code_used,
      hasCode: !!c.code_issued_at,
      createdAt: c.created_at,
      item: byId[c.item_id],
    }),
  )
  const items = rawItems.map((i) => ({
    ...i,
    autoHidden: daysSince(i.dateFound) > AUTO_HIDE_DAYS,
    claimCount: claims.filter((c) => c.itemId === i.id && c.status === 'Em análise').length,
  }))
  const reportsRaw = reportsRes.data.map((r) => toReport(r, urls))
  const pool = items.filter((i) => i.status !== STATUS.DEVOLVIDO)
  const matches = reportsRaw
    .filter((r) => r.open)
    .map((r) => ({ report: maskContact(r), matches: findMatches(r, pool, { min: 35, limit: 3 }) }))
    .filter((m) => m.matches.length)
  return { items, claims, reports: reportsRaw.map(maskContact), matches }
}

export async function updateItem(id, patch) {
  const allowed = {}
  if ('status' in patch) allowed.status = patch.status
  if ('sensitive' in patch) allowed.sensitive = !!patch.sensitive
  if ('hidden' in patch) allowed.hidden = !!patch.hidden
  const { error } = await supabase.from('items').update(allowed).eq('id', id)
  check(error, 'Não foi possível atualizar o objeto.')
}

export async function setReportOpen(reportId, open) {
  return setMyReportOpen(reportId, open)
}

export async function approveClaim(claimId) {
  const { error } = await supabase.rpc('approve_claim', { p_claim_id: claimId })
  check(error, 'Não foi possível aprovar a solicitação.')
}

export async function rejectClaim(claimId) {
  const { error } = await supabase.rpc('reject_claim', { p_claim_id: claimId })
  check(error, 'Não foi possível recusar a solicitação.')
}

/** Valida o código apresentado na recepção. Uso único: o objeto vira "Devolvido". */
export async function validatePickupCode(input) {
  const { data, error } = await supabase.rpc('validate_pickup_code', { p_code: input || '' })
  check(error, 'Não foi possível validar o código.')
  return data
}
