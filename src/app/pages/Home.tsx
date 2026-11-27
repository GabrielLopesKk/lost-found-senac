import { useState } from "react";
import { Link } from "@/app/lib/router-compat";
import { useNavigate } from "@/app/lib/router-hooks";
import useSWR from "swr";
import {
  Search,
  PackageSearch,
  HandHeart,
  ScanSearch,
  ArrowRight,
  Ticket,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { listPublicItems, getStats } from "../data/api";
import { CATEGORIES } from "../data/constants";
import { ItemCard } from "../components/ItemBits";
import { CATEGORY_ICONS } from "../components/itemConstants";
import { Spinner } from "../components/ui";
import type { FormEvent } from "react";

const ACTIONS = [
  {
    to: "/procurar",
    icon: PackageSearch,
    title: "Procurar objeto",
    text: "Veja tudo o que foi entregue na recepção.",
  },
  {
    to: "/achei",
    icon: HandHeart,
    title: "Achei algo",
    text: "Registre um objeto encontrado no campus.",
  },
  {
    to: "/perdi",
    icon: ScanSearch,
    title: "Perdi algo",
    text: "Crie um relato e receba um protocolo.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Solicite",
    text: "Encontrou seu objeto? Clique em “Tenho interesse” e descreva um detalhe que só o dono sabe.",
  },
  { n: "02", title: "Análise", text: "A recepção confere as informações e aprova a solicitação." },
  {
    n: "03",
    title: "Código",
    text: "Você recebe um código de retirada único, válido para um único uso.",
  },
  {
    n: "04",
    title: "Retirada",
    text: "Apresente o código na recepção e leve seu objeto de volta.",
  },
];

export default function Home() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { data: allItems } = useSWR(["public", "items", ""], () => listPublicItems());
  const { data: stats } = useSWR(["public", "stats"], getStats);
  const items = allItems?.slice(0, 6) ?? null;

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigate(`/procurar${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
  };

  return (
    <>
      <section className="grain relative overflow-hidden bg-navy-900 text-white">
        <div className="pointer-events-none absolute -right-24 top-10 hidden size-[420px] rounded-full border-[48px] border-flame-500/20 lg:block" />
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 md:pt-24">
          <p className="rise chip bg-white/10 text-flame-400 ring-1 ring-white/15">
            <Clock className="size-3.5" /> Recepção aberta de seg. a sex., 8h–22h
          </p>
          <h1
            className="rise mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl"
            style={{ animationDelay: "60ms" }}
          >
            Perdeu algo no campus? <span className="text-flame-400">A gente ajuda a achar.</span>
          </h1>
          <p
            className="rise mt-5 max-w-xl text-base text-white/75 sm:text-lg"
            style={{ animationDelay: "120ms" }}
          >
            O Achados &amp; Perdidos do Senac Canoas reúne tudo o que foi encontrado nas salas,
            laboratórios e corredores — com retirada segura na recepção.
          </p>
          <form
            onSubmit={submit}
            className="rise mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl sm:flex-row"
            style={{ animationDelay: "180ms" }}
            role="search"
          >
            <label className="flex flex-1 items-center gap-3 px-3">
              <Search className="size-5 shrink-0 text-muted" />
              <span className="sr-only">Buscar objeto</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ex.: garrafa azul, fone, chave…"
                className="w-full bg-transparent py-3 text-ink placeholder:text-muted/70 focus:outline-none"
              />
            </label>
            <button className="rounded-xl bg-flame-500 px-6 py-3 font-semibold text-white transition hover:bg-flame-600">
              Buscar
            </button>
          </form>
          <div className="rise mt-5 flex flex-wrap gap-2" style={{ animationDelay: "240ms" }}>
            {CATEGORIES.slice(0, 6).map((c) => {
              const Icon = CATEGORY_ICONS[c.id] ?? PackageSearch;
              return (
                <Link
                  key={c.id}
                  to={`/procurar?categoria=${c.id}`}
                  className="chip bg-white/10 py-1.5 text-white/85 ring-1 ring-white/15 transition hover:bg-white/20"
                >
                  <Icon className="size-3.5" /> {c.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-12 max-w-6xl px-4 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {ACTIONS.map(({ to, icon: Icon, title, text }, i) => (
            <Link
              key={to}
              to={to}
              className="card rise group flex items-start gap-4 p-5 transition hover:-translate-y-1 hover:border-flame-400"
              style={{ animationDelay: `${300 + i * 70}ms` }}
            >
              <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-flame-50 text-flame-600 transition group-hover:bg-flame-500 group-hover:text-white">
                <Icon className="size-6" />
              </div>
              <div className="flex-1">
                <h2 className="flex items-center justify-between text-lg font-bold text-navy-900">
                  {title}
                  <ArrowRight className="size-4 text-muted transition group-hover:translate-x-1 group-hover:text-flame-600" />
                </h2>
                <p className="mt-0.5 text-sm text-muted">{text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["Disponíveis", stats?.available, "objetos aguardando o dono"],
            ["Aguardando retirada", stats?.awaiting, "com solicitação aprovada"],
            ["Devolvidos", stats?.returned, "objetos que voltaram pra casa"],
            ["Relatos abertos", stats?.openReports, "pessoas procurando algo"],
          ].map(([label, value, hint], i) => (
            <div
              key={label}
              className={`rounded-2xl p-5 ${i === 2 ? "bg-navy-900 text-white" : "card"}`}
            >
              <p
                className={`text-xs font-semibold uppercase tracking-wider ${i === 2 ? "text-flame-400" : "text-muted"}`}
              >
                {label}
              </p>
              <p className="mt-2 font-display text-4xl font-extrabold">
                {value ?? (
                  <span className="inline-block h-9 w-12 animate-pulse rounded-lg bg-current opacity-10" />
                )}
              </p>
              <p className={`mt-1 text-xs ${i === 2 ? "text-white/60" : "text-muted"}`}>{hint}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-flame-600">
              Últimos registros
            </p>
            <h2 className="mt-1 text-3xl font-extrabold text-navy-900">Encontrados recentemente</h2>
          </div>
          <Link
            to="/procurar"
            className="hidden items-center gap-1 text-sm font-semibold text-navy-800 hover:text-flame-600 sm:inline-flex"
          >
            Ver todos <ArrowRight className="size-4" />
          </Link>
        </div>
        {!items ? (
          <Spinner />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it, i) => (
              <ItemCard key={it.id} item={it} style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        )}
        <Link
          to="/procurar"
          className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-navy-800 sm:hidden"
        >
          Ver todos <ArrowRight className="size-4" />
        </Link>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <div className="card overflow-hidden p-6 sm:p-10">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-flame-600">
                Como funciona a devolução
              </p>
              <h2 className="mt-1 text-3xl font-extrabold text-navy-900">
                Do “achei” ao “é meu!” em 4 passos
              </h2>
            </div>
            <p className="flex max-w-sm items-center gap-2 text-sm text-muted">
              <ShieldCheck className="size-4 shrink-0 text-flame-600" /> A posse é sempre confirmada
              por uma pessoa da recepção.
            </p>
          </div>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.n} className="relative border-t-2 border-navy-100 pt-4">
                <span className="absolute -top-[2px] left-0 h-[2px] w-10 bg-flame-500" />
                <span className="font-display text-sm font-bold text-flame-600">{s.n}</span>
                <h3 className="mt-1 text-lg font-bold text-navy-900">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex items-center gap-3 rounded-2xl bg-flame-50 p-4 text-sm text-navy-900">
            <Ticket className="size-5 shrink-0 text-flame-600" />
            Já tem um código de retirada? Leve-o até a recepção junto com um documento com foto.
          </div>
        </div>
      </section>
    </>
  );
}
