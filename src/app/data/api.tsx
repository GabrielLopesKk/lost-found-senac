// Camada de acesso a dados — Supabase.
//
// Todas as telas falam SOMENTE com estas funções. A segurança real está no
// banco (RLS + funções RPC): este arquivo só traduz linhas <-> objetos da UI.
import { supabase, PHOTO_BUCKET } from "../lib/supabase";
import { AUTO_HIDE_DAYS, STATUS } from "./constants";
import { daysSince, maskEmail, maskPhone, normalize } from "../lib/format";
import { findMatches } from "../lib/matching";
import type { PostgrestError } from "@supabase/supabase-js";
import type { Json } from "@/integrations/supabase/types";
import type {
  AdminOverview,
  Claim,
  CreateLostReportResult,
  Item,
  PickupCodeResult,
  Profile,
  Report,
} from "./types";

const SIGNED_URL_TTL = 60 * 60;
const PAGE_SIZE = 1000;
const SIGN_BATCH = 100;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PUBLIC_ITEM_COLS =
  "id, ref, name, category, color, location, date_found, description, marks, status, photo_path, photo_hidden, created_at";
const ITEM_COLS =
  "id, ref, name, category, color, location, date_found, description, marks, status, sensitive, hidden, photo_path, reported_by, created_at";
const REPORT_COLS =
  "id, ref, user_id, name, category, color, location, date_lost, description, contact_email, contact_phone, photo_path, is_open, created_at";
const CLAIM_COLS =
  "id, ref, item_id, user_id, name, contact_email, contact_phone, proof, status, code_used, code_issued_at, decided_at, picked_up_at, created_at";

// ---------- Utilidades ----------
type ServiceError = { message: string; code?: string };

function friendlyMessage(error: ServiceError | null, fallback: string): string {
  if (!error) return fallback;
  if (error.code === "P0001") return error.message; // mensagens das funções do banco
  if (error.code === "23505") return "Você já tem uma solicitação ativa para este objeto.";
  if (error.code === "23514") return "Alguns dados são inválidos. Revise o formulário.";
  if (error.code === "42501") return "Você não tem permissão para esta ação.";
  return fallback;
}
function check(error: ServiceError | null, fallback: string): void {
  if (error) throw new Error(friendlyMessage(error, fallback));
}

async function requireUserId() {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user?.id;
  if (!id) throw new Error("Faça login para continuar.");
  return id;
}

async function signPhotos(paths: (string | null | undefined)[]): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter((path): path is string => Boolean(path)))];
  if (!unique.length) return {};
  const batches = [];
  for (let i = 0; i < unique.length; i += SIGN_BATCH) batches.push(unique.slice(i, i + SIGN_BATCH));
  const results = await Promise.all(
    batches.map((b) => supabase.storage.from(PHOTO_BUCKET).createSignedUrls(b, SIGNED_URL_TTL)),
  );
  return Object.fromEntries(
    results.flatMap(({ data, error }) =>
      error || !data ? [] : data.filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]),
    ),
  );
}

/** Lê todas as páginas de uma consulta, sem cortar resultados no limite por requisição. */
export type RangeQuery<Row> = {
  range(
    from: number,
    to: number,
  ): PromiseLike<{ data?: Row[] | null | undefined; error: PostgrestError | null }>;
};

export async function fetchAllRows<Row>(
  buildQuery: () => RangeQuery<Row>,
  fallback: string,
): Promise<Row[]> {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);
    check(error, fallback);
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

async function uploadPhoto(dataUrl: string | null | undefined) {
  if (!dataUrl) return null;
  const userId = await requireUserId();
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });
  check(error, "Não foi possível enviar a foto. Tente novamente.");
  return path;
}

async function removePhoto(path: string | null | undefined) {
  if (path) await supabase.storage.from(PHOTO_BUCKET).remove([path]);
}

const cleanText = (s: string | null | undefined) => (s || "").trim();
const cleanPhone = (s: string | null | undefined) => (s || "").replace(/\D/g, "");

type ItemRow = {
  id: string | null;
  ref: string | null;
  name: string | null;
  category: string | null;
  color: string | null;
  location: string | null;
  date_found: string | null;
  description: string | null;
  marks: string[] | null;
  status: string | null;
  sensitive?: boolean | null;
  hidden?: boolean | null;
  photo_path: string | null;
  photo_hidden?: boolean | null;
  created_at: string | null;
};

function toItem(row: ItemRow, urls: Record<string, string> = {}): Item {
  return {
    id: row.id ?? "",
    ref: row.ref ?? "",
    name: row.name ?? "",
    category: row.category ?? "",
    color: row.color ?? "",
    location: row.location ?? "",
    dateFound: row.date_found ?? "",
    description: row.description ?? "",
    marks: row.marks || [],
    status: row.status ?? "",
    sensitive: !!row.sensitive,
    hidden: !!row.hidden,
    photo: row.photo_path ? (urls[row.photo_path] ?? null) : null,
    photoHidden: !!row.photo_hidden,
    createdAt: row.created_at ?? "",
  };
}

type ReportRow = {
  id: string;
  ref: string;
  user_id?: string;
  name: string;
  category: string;
  color: string;
  location: string;
  date_lost: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  photo_path: string | null;
  is_open: boolean;
  created_at: string;
};

function toReport(row: ReportRow, urls: Record<string, string> = {}): Report {
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
    photo: row.photo_path ? (urls[row.photo_path] ?? null) : null,
    open: row.is_open,
    createdAt: row.created_at,
  };
}

// ---------- Público ----------
export async function listPublicItems({
  q = "",
  category = "",
  color = "",
  location = "",
  from = "",
  to = "",
}: {
  q?: string;
  category?: string;
  color?: string;
  location?: string;
  from?: string;
  to?: string;
} = {}): Promise<Item[]> {
  const data = await fetchAllRows(() => {
    let query = supabase
      .from("public_items")
      .select(PUBLIC_ITEM_COLS)
      .order("date_found", { ascending: false })
      .order("id");
    if (category) query = query.eq("category", category);
    if (color) query = query.eq("color", color);
    if (location) query = query.eq("location", location);
    if (from) query = query.gte("date_found", from);
    if (to) query = query.lte("date_found", to);
    return query;
  }, "Não foi possível carregar os objetos.");

  // Busca textual sem acentos, feita aqui para aceitar "eletronico" = "eletrônico".
  const terms = normalize(q).split(/\s+/).filter(Boolean);
  const rows = terms.length
    ? data.filter((i) => {
        const hay = normalize(
          `${i.name} ${i.description} ${(i.marks || []).join(" ")} ${i.location}`,
        );
        return terms.every((t) => hay.includes(t));
      })
    : data;
  const urls = await signPhotos(rows.map((r) => r.photo_path));
  return rows.map((r) => toItem(r, urls));
}

export async function getPublicItem(id: string): Promise<Item | null> {
  if (!UUID_RE.test(id || "")) return null;
  const { data, error } = await supabase
    .from("public_items")
    .select(PUBLIC_ITEM_COLS)
    .eq("id", id)
    .maybeSingle();
  check(error, "Não foi possível carregar o objeto.");
  if (!data) return null;
  const urls = await signPhotos([data.photo_path]);
  return toItem(data, urls);
}

export async function getStats(): Promise<{
  available: number;
  awaiting: number;
  returned: number;
  openReports: number;
}> {
  const { data, error } = await supabase.rpc("get_public_stats");
  check(error, "Não foi possível carregar os números.");
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    typeof data["available"] !== "number" ||
    typeof data["awaiting"] !== "number" ||
    typeof data["returned"] !== "number" ||
    typeof data["openReports"] !== "number"
  ) {
    throw new Error("Os números retornados pelo banco são inválidos.");
  }
  return {
    available: data["available"],
    awaiting: data["awaiting"],
    returned: data["returned"],
    openReports: data["openReports"],
  };
}

// ---------- Usuário autenticado ----------
export async function createFoundItem(data: {
  name: string;
  category: string;
  color: string;
  location: string;
  dateFound: string;
  description: string;
  marks?: string[];
  sensitive?: boolean;
  photo?: string | null;
}) {
  const photoPath = await uploadPhoto(data.photo);
  const { data: row, error } = await supabase
    .from("items")
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
    .select("id, ref")
    .single();
  if (error) await removePhoto(photoPath);
  check(error, "Não foi possível registrar o objeto.");
  if (!row) throw new Error("O objeto foi salvo, mas não foi possível confirmar o protocolo.");
  return row;
}

export async function createLostReport(data: {
  name: string;
  category: string;
  color: string;
  location: string;
  dateLost: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  photo?: string | null;
}): Promise<CreateLostReportResult> {
  const photoPath = await uploadPhoto(data.photo);
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
  };
  const { data: row, error } = await supabase
    .from("lost_reports")
    .insert(payload)
    .select("id, ref")
    .single();
  if (error) await removePhoto(photoPath);
  check(error, "Não foi possível registrar o relato.");
  if (!row) throw new Error("O relato foi salvo, mas não foi possível confirmar o protocolo.");

  // O relato já foi salvo: falha nas sugestões não pode virar falha do cadastro.
  try {
    const pool = await listPublicItems();
    const lost = { ...payload, dateLost: payload.date_lost };
    return { ...row, matches: findMatches(lost, pool, { min: 45, limit: 3 }), matchesError: false };
  } catch {
    return { ...row, matches: [], matchesError: true };
  }
}

export async function createClaim(
  itemId: string,
  {
    name,
    contactEmail,
    contactPhone,
    proof,
  }: { name: string; contactEmail: string; contactPhone: string; proof: string },
): Promise<{ id: string; ref: string }> {
  const { data, error } = await supabase
    .from("claims")
    .insert({
      item_id: itemId,
      name: cleanText(name),
      contact_email: cleanText(contactEmail).toLowerCase(),
      contact_phone: cleanPhone(contactPhone),
      proof: cleanText(proof),
    })
    .select("id, ref")
    .single();
  if (error?.code === "42501")
    throw new Error("Este objeto não está mais disponível para solicitação.");
  check(error, "Não foi possível enviar a solicitação.");
  if (!data)
    throw new Error("A solicitação foi enviada, mas não foi possível confirmar o protocolo.");
  return data;
}

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .eq("id", userId)
    .maybeSingle();
  const { data: staff, error: staffError } = await supabase.rpc("is_staff");
  check(error, "Não foi possível carregar seu perfil.");
  check(staffError, "Não foi possível verificar suas permissões.");
  return data
    ? { id: data.id, fullName: data.full_name, phone: data.phone, role: staff ? "staff" : "user" }
    : null;
}

export async function updateMyProfile({ fullName, phone }: { fullName: string; phone: string }) {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: cleanText(fullName).slice(0, 120), phone: cleanPhone(phone).slice(0, 13) })
    .eq("id", userId);
  check(error, "Não foi possível salvar seu perfil.");
}

export async function listMyClaims(): Promise<Claim[]> {
  const data = await fetchAllRows(
    () => supabase.rpc("my_claims"),
    "Não foi possível carregar suas solicitações.",
  );
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
  }));
}

export async function cancelMyClaim(claimId: string) {
  const { error } = await supabase.from("claims").delete().eq("id", claimId);
  check(error, "Não foi possível cancelar a solicitação.");
}

/** Gera um novo código de retirada (invalida o anterior). O banco guarda só o hash. */
export async function issuePickupCode(claimId: string) {
  const { data, error } = await supabase.rpc("issue_pickup_code", { p_claim_id: claimId });
  check(error, "Não foi possível gerar o código.");
  return data;
}

export async function listMyReports() {
  const userId = await requireUserId();
  const data = await fetchAllRows(
    () =>
      supabase
        .from("lost_reports")
        .select(REPORT_COLS)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .order("id"),
    "Não foi possível carregar seus relatos.",
  );
  const urls = await signPhotos(data.map((r) => r.photo_path));
  return data.map((r) => toReport(r, urls));
}

export async function setMyReportOpen(reportId: string, open: boolean) {
  const { error } = await supabase
    .from("lost_reports")
    .update({ is_open: open })
    .eq("id", reportId);
  check(error, "Não foi possível atualizar o relato.");
}

export async function deleteMyReport(report: Pick<Report, "id">) {
  const { error } = await supabase.from("lost_reports").delete().eq("id", report.id);
  check(error, "Não foi possível excluir o relato.");
}

export async function listMyFoundItems() {
  const userId = await requireUserId();
  const data = await fetchAllRows(
    () =>
      supabase
        .from("items")
        .select(ITEM_COLS)
        .eq("reported_by", userId)
        .order("created_at", { ascending: false })
        .order("id"),
    "Não foi possível carregar seus registros.",
  );
  const urls = await signPhotos(data.map((r) => r.photo_path));
  return data.map((r) => toItem(r, urls));
}

// ---------- Administração (recepção) ----------
// O banco recusa estas operações para quem não tem perfil "staff".
const maskContact = <T extends { contactEmail: string; contactPhone: string }>(x: T) => ({
  ...x,
  contactEmail: maskEmail(x.contactEmail),
  contactPhone: maskPhone(x.contactPhone),
});

export async function adminOverview(): Promise<AdminOverview> {
  const fail = "Não foi possível carregar o painel.";
  const [itemRows, claimRows, reportRows] = await Promise.all([
    fetchAllRows(
      () =>
        supabase
          .from("items")
          .select(ITEM_COLS)
          .order("created_at", { ascending: false })
          .order("id"),
      fail,
    ),
    fetchAllRows(
      () =>
        supabase
          .from("claims")
          .select(CLAIM_COLS)
          .order("created_at", { ascending: false })
          .order("id"),
      fail,
    ),
    fetchAllRows(
      () =>
        supabase
          .from("lost_reports")
          .select(REPORT_COLS)
          .order("created_at", { ascending: false })
          .order("id"),
      fail,
    ),
  ]);
  const itemsRes = { data: itemRows },
    claimsRes = { data: claimRows },
    reportsRes = { data: reportRows };

  const urls = await signPhotos([...itemsRes.data, ...reportsRes.data].map((r) => r.photo_path));
  const rawItems = itemsRes.data.map((r) => toItem(r, urls));
  const byId = Object.fromEntries(rawItems.map((i) => [i.id, i]));
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
  );
  const items = rawItems.map((i) => ({
    ...i,
    autoHidden: daysSince(i.dateFound) > AUTO_HIDE_DAYS,
    claimCount: claims.filter((c) => c.itemId === i.id && c.status === "Em análise").length,
  }));
  const reportsRaw = reportsRes.data.map((r) => toReport(r, urls));
  const pool = items.filter((i) => i.status !== STATUS.DEVOLVIDO);
  const matches = reportsRaw
    .filter((r) => r.open)
    .map((r) => ({ report: maskContact(r), matches: findMatches(r, pool, { min: 35, limit: 3 }) }))
    .filter((m) => m.matches.length);
  return { items, claims, reports: reportsRaw.map(maskContact), matches };
}

export async function updateItem(
  id: string,
  patch: Partial<Pick<Item, "status" | "sensitive" | "hidden">>,
) {
  const allowed: Partial<Pick<Item, "status" | "sensitive" | "hidden">> = {};
  if ("status" in patch) allowed.status = patch.status;
  if ("sensitive" in patch) allowed.sensitive = !!patch.sensitive;
  if ("hidden" in patch) allowed.hidden = !!patch.hidden;
  const { error } = await supabase.from("items").update(allowed).eq("id", id);
  check(error, "Não foi possível atualizar o objeto.");
}

export async function setReportOpen(reportId: string, open: boolean) {
  return setMyReportOpen(reportId, open);
}

export async function approveClaim(claimId: string) {
  const { error } = await supabase.rpc("approve_claim", { p_claim_id: claimId });
  check(error, "Não foi possível aprovar a solicitação.");
}

export async function rejectClaim(claimId: string) {
  const { error } = await supabase.rpc("reject_claim", { p_claim_id: claimId });
  check(error, "Não foi possível recusar a solicitação.");
}

/** Valida o código apresentado na recepção. Uso único: o objeto vira "Devolvido". */
export async function validatePickupCode(input: string): Promise<PickupCodeResult> {
  const raw = (input || "").trim().toUpperCase().replace(/\s+/g, "");
  if (/^(PRD|OBJ)-?[A-Z0-9]{4,}$/.test(raw))
    throw new Error(
      'Esse é um número de protocolo, não o código de retirada. Peça ao dono o código de 8 caracteres mostrado em "Minha conta" (ex.: K7QM-4XPA).',
    );
  const code = raw.replace(/-/g, "");
  if (!/^[A-Z0-9]{8}$/.test(code))
    throw new Error("O código deve ter 8 letras ou números (ex.: K7QM-4XPA).");
  const { data, error } = await supabase.rpc("validate_pickup_code", { p_code: code });
  check(error, "Não foi possível validar o código.");
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    typeof data["itemRef"] !== "string" ||
    typeof data["itemName"] !== "string" ||
    typeof data["claimant"] !== "string"
  ) {
    throw new Error(
      "Não foi possível confirmar o resultado. Confira o status do objeto antes de tentar novamente.",
    );
  }
  return {
    itemRef: data["itemRef"],
    itemName: data["itemName"],
    claimant: data["claimant"],
  };
}
