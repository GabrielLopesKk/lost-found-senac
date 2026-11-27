import { useEffect, useState, type ChangeEvent } from "react";
import { Link } from "@/app/lib/router-compat";
import { useSearchParams } from "@/app/lib/router-hooks";
import useSWR from "swr";
import {
  Search as SearchIcon,
  SlidersHorizontal,
  RotateCcw,
  PackageSearch,
  Camera,
  Sparkles,
} from "lucide-react";
import { reencodeImage } from "../lib/imageTools";
import { analyzePhotoSmart } from "../lib/analyzePhoto";
import { listPublicItems } from "../data/api";
import { CATEGORIES, COLORS, LOCATIONS, AUTO_HIDE_DAYS } from "../data/constants";
import { ItemCard } from "../components/ItemBits";
import { Spinner, EmptyState } from "../components/ui";

const PARAMS = {
  q: "q",
  category: "categoria",
  color: "cor",
  location: "local",
  from: "de",
  to: "ate",
};

type FilterKey = keyof typeof PARAMS;
type SearchFilters = Record<FilterKey, string>;
type PhotoInfo = {
  preview?: string;
  error?: string;
  category?: string;
  color?: string;
  marks?: string[];
  source?: string;
};

export default function Search() {
  const [params, setParams] = useSearchParams();
  const filters: SearchFilters = {
    q: params.get(PARAMS.q) || "",
    category: params.get(PARAMS.category) || "",
    color: params.get(PARAMS.color) || "",
    location: params.get(PARAMS.location) || "",
    from: params.get(PARAMS.from) || "",
    to: params.get(PARAMS.to) || "",
  };
  const [text, setText] = useState(filters.q);
  const [showFilters, setShowFilters] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoInfo, setPhotoInfo] = useState<PhotoInfo | null>(null);

  async function searchByPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoBusy(true);
    setPhotoInfo(null);
    try {
      const { dataUrl } = await reencodeImage(file);
      const a = await analyzePhotoSmart(dataUrl, file.name);
      const next = new URLSearchParams();
      if (a.category && a.category !== "outros") next.set(PARAMS.category, a.category);
      if (a.color) next.set(PARAMS.color, a.color);
      setText("");
      setParams(next, { replace: true });
      setPhotoInfo({ preview: dataUrl, ...a });
    } catch (err) {
      setPhotoInfo({
        error: err instanceof Error ? err.message : "Não foi possível ler a foto.",
      });
    } finally {
      setPhotoBusy(false);
    }
  }

  const setFilter = (key: FilterKey, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(PARAMS[key], value);
    else next.delete(PARAMS[key]);
    setParams(next, { replace: true });
  };

  // busca textual com pequeno atraso para não consultar a cada tecla
  useEffect(() => {
    const t = setTimeout(() => {
      if (text !== filters.q) setFilter("q", text.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  const {
    data,
    error: loadError,
    isLoading,
  } = useSWR(["public", "items", params.toString()], () => listPublicItems(filters));
  const items = isLoading ? null : (data ?? null);
  const error = loadError ? "Não foi possível carregar os objetos. Tente novamente." : "";

  const activeCount = (["category", "color", "location", "from", "to"] as FilterKey[]).filter(
    (k) => filters[k],
  ).length;
  const clear = () => {
    setText("");
    setPhotoInfo(null);
    setParams({}, { replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-flame-600">Procurar</p>
        <h1 className="mt-1 text-3xl font-extrabold text-navy-900 sm:text-4xl">
          Objetos encontrados no campus
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Objetos devolvidos ou com mais de {AUTO_HIDE_DAYS} dias saem automaticamente da lista.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="card flex flex-1 items-center gap-3 px-4">
          <SearchIcon className="size-5 text-muted" />
          <span className="sr-only">Palavras-chave</span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nome, descrição ou detalhe (ex.: adesivo, iniciais)"
            className="w-full bg-transparent py-3.5 focus:outline-none"
          />
        </label>
        <label
          className={`card inline-flex cursor-pointer items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-navy-900 ${photoBusy ? "opacity-60" : ""}`}
        >
          <Camera className="size-4" /> {photoBusy ? "Analisando foto…" : "Buscar por foto"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={photoBusy}
            onChange={searchByPhoto}
          />
        </label>
        <button
          onClick={() => setShowFilters((s) => !s)}
          className="card inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-navy-900 lg:hidden"
        >
          <SlidersHorizontal className="size-4" /> Filtros{" "}
          {activeCount > 0 && <span className="chip bg-flame-500 text-white">{activeCount}</span>}
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className={`${showFilters ? "block" : "hidden"} lg:block`}>
          <div className="card sticky top-20 space-y-5 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-navy-900">Filtros</h2>
              {(activeCount > 0 || filters.q) && (
                <button
                  onClick={clear}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-flame-600 hover:underline"
                >
                  <RotateCcw className="size-3" /> Limpar
                </button>
              )}
            </div>
            <label className="block">
              <span className="label">Categoria</span>
              <select
                className="input"
                value={filters.category}
                onChange={(e) => setFilter("category", e.target.value)}
              >
                <option value="">Todas</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <span className="label">Cor</span>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    aria-label={c.label}
                    aria-pressed={filters.color === c.id}
                    onClick={() => setFilter("color", filters.color === c.id ? "" : c.id)}
                    className={`size-7 rounded-full ring-1 ring-black/10 transition hover:scale-110 ${filters.color === c.id ? "ring-4 ring-flame-500 ring-offset-2" : ""}`}
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
            </div>
            <label className="block">
              <span className="label">Local</span>
              <select
                className="input"
                value={filters.location}
                onChange={(e) => setFilter("location", e.target.value)}
              >
                <option value="">Todos os locais</option>
                {LOCATIONS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="label">De</span>
                <input
                  type="date"
                  className="input px-2"
                  value={filters.from}
                  onChange={(e) => setFilter("from", e.target.value)}
                />
              </label>
              <label className="block">
                <span className="label">Até</span>
                <input
                  type="date"
                  className="input px-2"
                  value={filters.to}
                  onChange={(e) => setFilter("to", e.target.value)}
                />
              </label>
            </div>
          </div>
        </aside>

        <section aria-live="polite">
          {photoInfo && (
            <div className="card mb-5 flex items-start gap-4 p-4">
              {photoInfo.preview && (
                <img
                  src={photoInfo.preview}
                  alt="Foto enviada"
                  className="size-16 rounded-xl object-cover"
                />
              )}
              <div className="text-sm">
                {photoInfo.error ? (
                  <p className="text-red-600">{photoInfo.error}</p>
                ) : (
                  <>
                    <p className="flex items-center gap-1.5 font-semibold text-navy-900">
                      <Sparkles className="size-4 text-flame-500" /> Filtros aplicados a partir da
                      foto
                    </p>
                    <p className="mt-1 text-muted">
                      {CATEGORIES.find((c) => c.id === photoInfo.category)?.label ||
                        "Categoria indefinida"}{" "}
                      · {COLORS.find((c) => c.id === photoInfo.color)?.label || "cor indefinida"}
                      {photoInfo.marks?.length ? ` · ${photoInfo.marks.join(", ")}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {photoInfo.source === "ai"
                        ? "Analisado por IA."
                        : "Análise local (cor estimada)."}{" "}
                      Ajuste os filtros se necessário.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
          {error ? (
            <EmptyState icon={PackageSearch} title="Algo deu errado">
              {error}
            </EmptyState>
          ) : !items ? (
            <Spinner label="Buscando objetos…" />
          ) : items.length === 0 ? (
            <EmptyState icon={PackageSearch} title="Nenhum objeto encontrado">
              Tente outros filtros ou{" "}
              <Link to="/perdi" className="font-semibold text-flame-600 underline">
                registre um relato de perda
              </Link>{" "}
              — avisaremos a recepção se algo parecido aparecer.
            </EmptyState>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted">
                {items.length} {items.length === 1 ? "objeto encontrado" : "objetos encontrados"}
              </p>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((it, i) => (
                  <ItemCard
                    key={it.id}
                    item={it}
                    style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
