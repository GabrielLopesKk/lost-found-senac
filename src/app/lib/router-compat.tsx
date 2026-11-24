// @ts-nocheck -- thin react-router shim; loose types by design
// Compatibility layer: lets the ported pages keep react-router-style calls on top of TanStack Router.
import { useEffect, type ReactNode, type MouseEvent } from "react";
import {
  Outlet,
  useRouter,
  useLocation as useTsLocation,
  useParams as useTsParams,
} from "@tanstack/react-router";

export { Outlet };

type NavOpts = { replace?: boolean | undefined; state?: Record<string, unknown> | undefined };

export function useNavigate() {
  const router = useRouter();
  return (to: string | number, opts: NavOpts = {}) => {
    if (typeof to === "number") return router.history.go(to);
    const state = (opts.state ?? {}) as never;
    if (opts.replace) router.history.replace(to, state);
    else router.history.push(to, state);
  };
}

export function useLocation() {
  const loc = useTsLocation();
  return { pathname: loc.pathname, search: loc.searchStr, hash: loc.hash, state: loc.state as any };
}

export function useParams() {
  return useTsParams({ strict: false }) as Record<string, string>;
}

export function useSearchParams() {
  const loc = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(loc.search);
  const set = (next: any, opts: NavOpts = {}) => {
    const value = typeof next === "function" ? next(new URLSearchParams(loc.search)) : next;
    const qs = new URLSearchParams(value).toString();
    navigate(loc.pathname + (qs ? `?${qs}` : ""), opts);
  };
  return [params, set] as const;
}

type LinkProps = {
  to: string;
  state?: Record<string, unknown>;
  replace?: boolean;
  children?: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  [key: string]: any;
};

export function Link({ to, state, replace, onClick, ...rest }: LinkProps) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || rest["target"]) return;
        e.preventDefault();
        navigate(to, { replace, state });
      }}
    />
  );
}

export function NavLink({ to, end, className, children, ...rest }: LinkProps & { end?: boolean }) {
  const { pathname } = useLocation();
  const isActive = end || to === "/" ? pathname === to : pathname === to || pathname.startsWith(to + "/");
  const cls = typeof className === "function" ? className({ isActive }) : className;
  const kids = typeof children === "function" ? children({ isActive }) : children;
  return (
    <Link to={to} className={cls} aria-current={isActive ? "page" : undefined} {...rest}>
      {kids}
    </Link>
  );
}

export function Navigate({ to, replace, state }: { to: string; replace?: boolean; state?: Record<string, unknown> }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace, state });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);
  return null;
}
