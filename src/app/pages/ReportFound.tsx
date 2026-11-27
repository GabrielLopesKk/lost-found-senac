import { useState, type FormEvent } from "react";
import { Link } from "@/app/lib/router-compat";
import { useSWRConfig } from "swr";
import { CircleCheck, EyeOff } from "lucide-react";
import { createFoundItem } from "../data/api";
import { useAuth } from "../auth/auth-context";
import { ItemFields, PhotoPicker, SuggestionBox } from "../components/forms";
import {
  mergeSuggestion,
  todayISO,
  validateItemFields,
  type FieldErrors,
  type ItemFormValues,
  type PhotoAnalysis,
} from "../components/form-utils";
import { FormError } from "../components/AuthCard";
import { Button, Field } from "../components/ui";
import { useToast } from "../components/toast-context";
import { errorMessage } from "../lib/errorMessage";

type FoundFormValues = ItemFormValues & {
  dateFound: string;
  marks: string;
  sensitive: boolean;
  photo: string | null;
};

const EMPTY: Omit<FoundFormValues, "dateFound"> = {
  name: "",
  category: "",
  color: "",
  location: "",
  description: "",
  marks: "",
  sensitive: false,
  photo: null,
};

export default function ReportFound() {
  const { user } = useAuth();
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const [values, setValues] = useState<FoundFormValues>({ ...EMPTY, dateFound: todayISO() });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ id: string; ref: string } | null>(null);
  const set = (key: keyof FoundFormValues, value: string | boolean | null) =>
    setValues((current) => ({ ...current, [key]: value }));

  function applySuggestion() {
    setValues((s) => mergeSuggestion(s, analysis));
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const errs = validateItemFields(values, "dateFound");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const row = await createFoundItem({ ...values, marks: values.marks.split(",") });
      mutate((key) => Array.isArray(key) && (key[0] === "public" || key[0] === "my-items"));
      toast("Objeto registrado. Obrigado por ajudar!");
      setCreated(row);
    } catch (err) {
      setError(errorMessage(err, "Não foi possível registrar o objeto."));
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className="card rise flex flex-col items-center p-8 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-flame-50 text-flame-600">
            <CircleCheck className="size-7" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-navy-900">Objeto registrado</h1>
          <p className="mt-2 text-sm text-muted">
            Código do registro: <strong className="text-navy-900">{created.ref}</strong>. Entregue o
            objeto na recepção para que ele fique guardado com segurança.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to={`/objeto/${created.id}`}
              className="rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Ver publicação
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                setCreated(null);
                setValues({ ...EMPTY, dateFound: todayISO() });
                setAnalysis(null);
              }}
            >
              Registrar outro
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-flame-600">Achei algo</p>
        <h1 className="mt-1 text-3xl font-extrabold text-navy-900 sm:text-4xl">
          Registrar objeto encontrado
        </h1>
        <p className="mt-2 text-muted">
          Registrado como {user?.email}. Depois de publicar, leve o objeto até a recepção.
        </p>
      </header>
      <form onSubmit={submit} className="card space-y-6 p-6 sm:p-8" noValidate>
        <PhotoPicker
          value={values.photo}
          onChange={(p) => {
            set("photo", p);
            if (!p) setAnalysis(null);
          }}
          onAnalyzed={setAnalysis}
        />
        <SuggestionBox analysis={analysis} onApply={applySuggestion} />
        <ItemFields
          values={values}
          errors={errors}
          set={set}
          dateKey="dateFound"
          dateLabel="Data em que foi encontrado"
          descriptionHint="Descreva o objeto sem revelar detalhes que só o dono saberia — eles servem para confirmar a posse."
        />
        <Field
          label="Marcas visíveis"
          hint="Separe por vírgula. Ex.: adesivo da NASA, alça rasgada"
        >
          <input
            className="input"
            value={values.marks}
            onChange={(e) => set("marks", e.target.value)}
          />
        </Field>
        <label className="flex items-start gap-3 rounded-2xl border border-line p-4">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-flame-500"
            checked={values.sensitive}
            onChange={(e) => set("sensitive", e.target.checked)}
          />
          <span className="text-sm">
            <span className="flex items-center gap-1.5 font-semibold text-navy-900">
              <EyeOff className="size-4" /> Foto com dados sensíveis
            </span>
            <span className="text-muted">
              Marque se a foto mostra rostos, documentos, cartões ou telas desbloqueadas. Ela ficará
              visível só para a recepção.
            </span>
          </span>
        </label>
        <FormError>{error}</FormError>
        <Button type="submit" loading={busy} className="w-full py-3">
          Publicar objeto encontrado
        </Button>
      </form>
    </div>
  );
}
