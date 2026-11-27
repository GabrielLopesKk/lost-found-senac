import { Navigate, Link } from "@/app/lib/router-compat";
import { useLocation } from "@/app/lib/router-hooks";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "./auth-context";
import { Spinner, EmptyState } from "../components/ui";
import { Button } from "../components/ui";
import type { ReactNode } from "react";

export default function RequireAuth({
  children,
  staff = false,
}: {
  children: ReactNode;
  staff?: boolean;
}) {
  const { user, isStaff, loading, profileError, refreshProfile } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Verificando sua sessão…" />;
  if (!user)
    return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />;
  if (profileError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <EmptyState icon={ShieldAlert} title="Não foi possível carregar sua conta">
          {profileError.message || "Verifique sua conexão e tente novamente."}
          <div className="mt-4">
            <Button onClick={() => refreshProfile()}>Tentar novamente</Button>
          </div>
        </EmptyState>
      </div>
    );
  }
  if (staff && !isStaff) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <EmptyState icon={ShieldAlert} title="Área restrita à recepção">
          Sua conta não tem permissão de administração. Se você faz parte da equipe, peça para um
          responsável liberar seu acesso.{" "}
          <Link to="/" className="font-semibold text-flame-600 underline">
            Voltar ao início
          </Link>
        </EmptyState>
      </div>
    );
  }
  return children;
}
