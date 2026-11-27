import { useState, type FormEvent } from "react";
import { Link } from "@/app/lib/router-compat";
import { useLocation, useParams } from "@/app/lib/router-hooks";
import useSWR, { useSWRConfig } from "swr";
import { ArrowLeft, MapPin, Calendar, Tag, HandHeart, PackageX, ShieldCheck } from "lucide-react";
import { getPublicItem, createClaim } from "../data/api";
import { categoryLabel, STATUS } from "../data/constants";
import { formatDate, relativeDays } from "../lib/format";
import { useAuth } from "../auth/auth-context";
import { ItemThumb, StatusBadge, ColorDot } from "../components/ItemBits";
import { validateContact } from "../components/form-utils";
import { FormError } from "../components/AuthCard";
import { Button, EmptyState, Field, Modal, Spinner } from "../components/ui";
import { useToast } from "../components/toast-context";
import type { Item } from "../data/types";
import { errorMessage } from "../lib/errorMessage";

type ClaimFormValues = {
  name: string;
  contactEmail: string;
  contactPhone: string;
  proof: string;
};
type ClaimFormErrors = Partial<Record<keyof ClaimFormValues, string>>;

function ClaimForm({ item, onDone }: { item: Item; onDone: () => void }) {
  const { user, profile } = useAuth();
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const [form, setForm] = useState<ClaimFormValues>({
    name: profile?.fullName || "",
    contactEmail: user?.email || "",
    contactPhone: profile?.phone || "",
    proof: "",
  });
  const [errors, setErrors] = useState<ClaimFormErrors>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key: keyof ClaimFormValues, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const errs: ClaimFormErrors = { ...validateContact(form) };
    if (form.name.trim().length < 2) errs.name = "Informe seu nome.";
    const proof = form.proof.trim();
    if (proof.length < 10) errs.proof = "Descreva com pelo menos 10 caracteres.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const claim = await createClaim(item.id, form);
      if (user) mutate(["my-claims", user.id]);
      toast(`Solicitação ${claim.ref} enviada para análise.`);
      onDone();
    } catch (err) {
      setError(errorMessage(err, "Não foi possível enviar a solicitação."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <p className="rounded-xl bg-navy-50 p-3 text-sm text-navy-900">
        A recepção vai conferir suas informações. Se aprovada, você gera o código de retirada em{" "}
        <strong>Minha conta</strong>.
      </p>
      <Field label="Seu nome" required error={errors.name}>
        <input
          className="input"
          maxLength={120}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="E-mail" error={errors.contactEmail}>
          <input
            type="email"
            className="input"
            value={form.contactEmail}
            onChange={(e) => set("contactEmail", e.target.value)}
          />
        </Field>
        <Field label="Telefone" error={errors.contactPhone}>
          <input
            type="tel"
            inputMode="numeric"
            className="input"
            value={form.contactPhone}
            onChange={(e) => set("contactPhone", e.target.value)}
          />
        </Field>
      </div>
      <Field
        label="Prova de posse"
        required
        error={errors.proof}
        hint="Um detalhe que só o dono sabe: adesivo, conteúdo, arranhão, senha de bloqueio da tela…"
      >
        <textarea
          className="input min-h-28"
          maxLength={600}
          value={form.proof}
          onChange={(e) => set("proof", e.target.value)}
        />
      </Field>
      <FormError>{error}</FormError>
      <Button type="submit" loading={busy} className="w-full">
        Enviar solicitação
      </Button>
    </form>
  );
}

export default function ItemDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const {
    data: item,
    error,
    isLoading,
  } = useSWR(id ? ["public", "item", id] : null, () =>
    id ? getPublicItem(id) : Promise.resolve(null),
  );

  if (isLoading) return <Spinner label="Carregando objeto…" />;
  if (error || !item) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <EmptyState icon={PackageX} title={error ? "Algo deu errado" : "Objeto indisponível"}>
          {error
            ? error.message
            : "Este objeto já foi devolvido, saiu da lista ou o link está incorreto."}{" "}
          <Link to="/procurar" className="font-semibold text-flame-600 underline">
            Ver outros objetos
          </Link>
        </EmptyState>
      </div>
    );
  }

  const claimable = item.status === STATUS.ENCONTRADO;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        to="/procurar"
        className="inline-flex items-center gap-1 text-sm font-semibold text-navy-800 hover:text-flame-600"
      >
        <ArrowLeft className="size-4" /> Voltar para a busca
      </Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="card aspect-[4/3] overflow-hidden">
          <ItemThumb item={item} className="object-contain" />
        </div>
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={item.status} />
            <span className="chip bg-navy-50 text-navy-800">
              <Tag className="size-3" /> {item.ref}
            </span>
          </div>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-muted">
            {categoryLabel(item.category)}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-navy-900 sm:text-4xl">{item.name}</h1>
          <p className="mt-4 whitespace-pre-line text-ink/85">{item.description}</p>
          {item.marks.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {item.marks.map((m) => (
                <span key={m} className="chip bg-flame-50 text-flame-600">
                  {m}
                </span>
              ))}
            </div>
          )}
          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-line bg-white p-4 text-sm">
            <div>
              <dt className="text-muted">Local</dt>
              <dd className="mt-0.5 flex items-center gap-1 font-semibold text-navy-900">
                <MapPin className="size-4" />
                {item.location}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Encontrado</dt>
              <dd className="mt-0.5 flex items-center gap-1 font-semibold text-navy-900">
                <Calendar className="size-4" />
                {formatDate(item.dateFound)} · {relativeDays(item.dateFound)}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Cor</dt>
              <dd className="mt-0.5 font-semibold text-navy-900">
                <ColorDot color={item.color} withLabel />
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            {!claimable ? (
              <p className="rounded-2xl bg-navy-50 p-4 text-sm text-navy-900">
                Este objeto já tem uma solicitação aprovada e aguarda retirada.
              </p>
            ) : user ? (
              <Button onClick={() => setOpen(true)} className="w-full py-3 sm:w-auto">
                <HandHeart className="size-5" /> Tenho interesse — é meu
              </Button>
            ) : (
              <Link
                to="/entrar"
                state={{ from: location.pathname }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-flame-500 px-5 py-3 text-sm font-semibold text-white hover:bg-flame-600 sm:w-auto"
              >
                <HandHeart className="size-5" /> Entre para solicitar este objeto
              </Link>
            )}
            <p className="mt-3 flex items-center gap-2 text-xs text-muted">
              <ShieldCheck className="size-4 text-flame-600" /> A posse é sempre confirmada pela
              recepção antes da retirada.
            </p>
          </div>
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={`Solicitar: ${item.name}`}>
        <ClaimForm item={item} onDone={() => setOpen(false)} />
      </Modal>
    </div>
  );
}
