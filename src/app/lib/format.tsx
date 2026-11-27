export const formatDate = (iso: string | null | undefined) =>
  iso
    ? new Date(iso + (iso.length === 10 ? "T12:00:00" : "")).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export const relativeDays = (iso: string) => {
  const days = Math.round((Date.now() - new Date(iso + "T12:00:00").getTime()) / 86400000);
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  return `há ${days} dias`;
};

export const daysSince = (iso: string) =>
  Math.floor((Date.now() - new Date(iso + "T12:00:00").getTime()) / 86400000);

// Mascaramento de contato: nunca exibimos dados completos, nem para a equipe.
export const maskEmail = (email: string | null | undefined) => {
  if (!email) return "";
  const [user = "", domain] = email.split("@");
  if (!domain) return "•••";
  return `${user.slice(0, 2)}${"•".repeat(Math.max(2, user.length - 2))}@${domain}`;
};

export const maskPhone = (phone: string | null | undefined) => {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  return `(${digits.slice(0, 2)}) •••••-${digits.slice(-4)}`;
};

export const normalize = (s: string | null | undefined) =>
  (s || "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
