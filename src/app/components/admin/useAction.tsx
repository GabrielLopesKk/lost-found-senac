import { useState } from "react";
import { useSWRConfig } from "swr";
import { useToast } from "../toast-context";

export function useAction(refresh: () => Promise<unknown>) {
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<unknown>, message?: string) {
    setBusy(key);
    let result;
    try {
      result = await fn();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível concluir a ação.", "error");
      setBusy(null);
      return undefined;
    }
    if (message) toast(message);
    try {
      await Promise.all([refresh(), mutate((k) => Array.isArray(k) && k[0] === "public")]);
    } catch {
      toast(
        "Ação salva, mas não foi possível atualizar a lista agora. Recarregue para conferir.",
        "error",
      );
    } finally {
      setBusy(null);
    }
    return result;
  }
  return { busy, run };
}
