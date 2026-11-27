export const todayISO = () => new Date().toLocaleDateString("sv-SE");

export type PhotoAnalysis = {
  source?: string;
  category?: string;
  color?: string;
  marks?: string[];
  characteristics?: string[];
  sensitiveWarning?: boolean;
  note?: string;
};

export type ItemFormValues = {
  name: string;
  category: string;
  color: string;
  location: string;
  dateFound?: string;
  dateLost?: string;
  description: string;
  marks?: string;
  photo?: string | null;
  sensitive?: boolean;
  contactEmail?: string;
  contactPhone?: string;
};

type DateKey = "dateFound" | "dateLost";
export type FieldErrors = Partial<Record<keyof ItemFormValues, string>>;

export function mergeSuggestion<T extends Partial<ItemFormValues>>(
  values: T,
  analysis?: PhotoAnalysis | null,
): T & { color: string; category: string; sensitive: boolean } {
  return {
    ...values,
    color: analysis?.color || values.color || "",
    category:
      analysis?.category && analysis.category !== "outros"
        ? analysis.category
        : values.category || "",
    sensitive: Boolean(values.sensitive || analysis?.sensitiveWarning),
  };
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function validateItemFields(v: ItemFormValues, dateKey: DateKey): FieldErrors {
  const errors: FieldErrors = {};
  if (!v.name || v.name.trim().length < 2) errors.name = "Informe um nome com pelo menos 2 letras.";
  else if (v.name.trim().length > 80) errors.name = "Use no máximo 80 caracteres.";
  if (!v.category) errors.category = "Escolha uma categoria.";
  if (!v.color) errors.color = "Escolha a cor principal.";
  if (!v.location) errors.location = "Escolha o local.";
  if (!v[dateKey]) errors[dateKey] = "Informe a data.";
  else if (v[dateKey] && v[dateKey] > todayISO())
    errors[dateKey] = "A data não pode estar no futuro.";
  const description = (v.description || "").trim();
  if (description.length < 10) errors.description = "Descreva com pelo menos 10 caracteres.";
  else if (description.length > 600) errors.description = "Use no máximo 600 caracteres.";
  return errors;
}

export function validateContact({
  contactEmail,
  contactPhone,
}: {
  contactEmail?: string;
  contactPhone?: string;
}): Partial<Record<"contactEmail" | "contactPhone", string>> {
  const errors: Partial<Record<"contactEmail" | "contactPhone", string>> = {};
  const email = (contactEmail || "").trim();
  const phone = (contactPhone || "").replace(/\D/g, "");
  if (!email && !phone) errors.contactEmail = "Informe pelo menos um contato.";
  if (email && !EMAIL_RE.test(email)) errors.contactEmail = "E-mail inválido.";
  if (phone && (phone.length < 10 || phone.length > 11))
    errors.contactPhone = "Use DDD + número (10 ou 11 dígitos).";
  return errors;
}
