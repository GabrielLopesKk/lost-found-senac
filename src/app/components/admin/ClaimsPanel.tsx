import { useState } from "react";
import { Ticket } from "lucide-react";
import { approveClaim, rejectClaim } from "../../data/api";
import { CLAIM_STATUS } from "../../data/constants";
import { formatDate } from "../../lib/format";
import { ItemThumb } from "../ItemBits";
import { Button, EmptyState } from "../ui";
import { useAction } from "./useAction";
import type { AdminOverview } from "../../data/types";

const FILTERS = ["Em análise", "Aprovada", "Recusada", "Todas"];

export default function ClaimsPanel({
  data,
  refresh,
}: {
  data: AdminOverview;
  refresh: () => Promise<unknown>;
}) {
  const [filter, setFilter] = useState("Em análise");
  const { busy, run } = useAction(refresh);
  const list = data.claims.filter((c) => filter === "Todas" || c.status === filter);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`chip py-1.5 ${filter === f ? "bg-navy-900 text-white" : "bg-white text-navy-900 ring-1 ring-line"}`}
          >
            {f}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState icon={Ticket} title="Nada por aqui">
          Nenhuma solicitação neste filtro.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {list.map((c) => (
            <li key={c.id} className="card grid gap-4 p-5 md:grid-cols-[96px_1fr_auto]">
              <div className="size-24 overflow-hidden rounded-xl">
                {c.item ? <ItemThumb item={c.item} /> : null}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted">
                  {c.ref} · {formatDate(c.createdAt.slice(0, 10))} · {c.status}
                  {c.codeUsed ? " · retirado" : c.hasCode ? " · código gerado" : ""}
                </p>
                <p className="mt-0.5 font-bold text-navy-900">
                  {c.item?.name ?? "Objeto removido"}{" "}
                  <span className="font-normal text-muted">({c.item?.ref})</span>
                </p>
                <p className="mt-1 text-sm text-navy-900">
                  <strong>{c.name}</strong> ·{" "}
                  {[c.contactEmail, c.contactPhone].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-2 rounded-xl bg-navy-50 p-3 text-sm text-ink/85">
                  <span className="font-semibold text-navy-900">Prova de posse: </span>
                  {c.proof}
                </p>
                {c.item?.marks && c.item.marks.length > 0 && (
                  <p className="mt-2 text-xs text-muted">
                    Marcas registradas: {c.item.marks.join(", ")}
                  </p>
                )}
              </div>
              {c.status === CLAIM_STATUS.PENDENTE && (
                <div className="flex gap-2 md:flex-col">
                  <Button
                    loading={busy === `a-${c.id}`}
                    onClick={() =>
                      run(
                        `a-${c.id}`,
                        () => approveClaim(c.id),
                        "Solicitação aprovada. O solicitante já pode gerar o código.",
                      )
                    }
                  >
                    Aprovar
                  </Button>
                  <Button
                    variant="danger"
                    loading={busy === `r-${c.id}`}
                    onClick={() =>
                      run(`r-${c.id}`, () => rejectClaim(c.id), "Solicitação recusada.")
                    }
                  >
                    Recusar
                  </Button>
                </div>
              )}
              {c.status === CLAIM_STATUS.APROVADA && !c.codeUsed && (
                <div>
                  <Button
                    variant="outline"
                    loading={busy === `r-${c.id}`}
                    onClick={() =>
                      window.confirm("Revogar esta aprovação?") &&
                      run(`r-${c.id}`, () => rejectClaim(c.id), "Aprovação revogada.")
                    }
                  >
                    Revogar
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
