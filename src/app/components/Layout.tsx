import { useEffect, useState } from "react";
import { NavLink, Link, Outlet } from "@/app/lib/router-compat";
import { useLocation } from "@/app/lib/router-hooks";
import { Menu, X, ShieldCheck, LogOut, UserRound } from "lucide-react";
import { useAuth } from "../auth/auth-context";
import { NAV } from "../data/navigation";

type LinkState = { isActive: boolean };
type LinkClassName = (state: LinkState) => string;

function AccountLinks({ linkCls, mobile = false }: { linkCls: LinkClassName; mobile?: boolean }) {
  const { user, profile, signOut, loading } = useAuth();
  if (loading) return null;
  if (!user) {
    return (
      <div className={`flex gap-2 ${mobile ? "mt-2 border-t border-line pt-3" : "ml-2"}`}>
        <NavLink to="/entrar" className={linkCls}>
          Entrar
        </NavLink>
        <Link
          to="/cadastro"
          className="rounded-lg bg-flame-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-flame-600"
        >
          Criar conta
        </Link>
      </div>
    );
  }
  return (
    <div
      className={`flex items-center gap-1 ${mobile ? "mt-2 border-t border-line pt-3" : "ml-2 border-l border-line pl-3"}`}
    >
      <NavLink
        to="/minha-conta"
        className={(s) => `${linkCls(s)} inline-flex items-center gap-1.5`}
      >
        <UserRound className="size-4" /> {profile?.fullName?.split(" ")[0] || "Minha conta"}
      </NavLink>
      <button
        onClick={signOut}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-navy-900/80 transition hover:bg-navy-50 hover:text-navy-900"
        aria-label="Sair da conta"
      >
        <LogOut className="size-4" /> {mobile && "Sair"}
      </button>
    </div>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <img src="/favicon.svg" alt="" className="size-9" />
      <span className="leading-tight">
        <span className="block font-display text-[15px] font-extrabold text-navy-900">
          Achados &amp; Perdidos
        </span>
        <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-flame-600">
          Senac Canoas
        </span>
      </span>
    </Link>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { isStaff } = useAuth();
  const nav = NAV.filter((n) => !n.staff || isStaff);
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  const linkCls: LinkClassName = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? "bg-navy-900 text-white" : "text-navy-900/80 hover:bg-navy-50 hover:text-navy-900"}`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={linkCls}>
                {n.label}
              </NavLink>
            ))}
            <AccountLinks linkCls={linkCls} />
          </nav>
          <button
            className="rounded-lg p-2 text-navy-900 hover:bg-navy-50 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Abrir menu"
            aria-expanded={open}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
        {open && (
          <nav
            className="rise border-t border-line bg-white px-4 py-3 md:hidden"
            aria-label="Menu móvel"
          >
            <div className="flex flex-col gap-1">
              {nav.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.end} className={linkCls}>
                  {n.label}
                </NavLink>
              ))}
              <AccountLinks linkCls={linkCls} mobile />
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-20 bg-navy-950 text-white/70">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
          <div>
            <p className="font-display text-lg font-bold text-white">Achados &amp; Perdidos</p>
            <p className="mt-1 text-sm">Senac Canoas · Rio Grande do Sul</p>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-white">Retirada de objetos</p>
            <p className="mt-1">
              Na recepção, de segunda a sexta, das 8h às 22h. Apresente seu código de retirada.
            </p>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-flame-400" />
            <p>
              Seus dados de contato nunca são exibidos publicamente. Fotos com rostos, documentos ou
              cartões ficam restritas à recepção.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
