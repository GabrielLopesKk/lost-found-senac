// Compatibility layer: lets the ported pages keep react-router-style calls on top of TanStack Router.
import { useEffect, type AnchorHTMLAttributes, type ReactNode } from "react";
import { Outlet } from "@tanstack/react-router";
import { useLocation, useNavigate } from "./router-hooks";

export { Outlet };

type NavOpts = { replace?: boolean | undefined; state?: Record<string, unknown> | undefined };

type LinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "className" | "children"
> & {
  to: string;
  state?: Record<string, unknown> | undefined;
  replace?: boolean | undefined;
  children?: ReactNode | ((state: { isActive: boolean }) => ReactNode);
  className?: string | undefined | ((state: { isActive: boolean }) => string);
};

export function Link({ to, state, replace, onClick, className, children, ...rest }: LinkProps) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      {...rest}
      className={typeof className === "string" ? className : undefined}
      onClick={(e) => {
        onClick?.(e);
        if (
          e.defaultPrevented ||
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey ||
          rest["target"]
        )
          return;
        e.preventDefault();
        navigate(to, { replace, state });
      }}
    >
      {typeof children === "function" ? children({ isActive: false }) : children}
    </a>
  );
}

export function NavLink({
  to,
  end,
  className,
  children,
  ...rest
}: LinkProps & { end?: boolean | undefined }) {
  const { pathname } = useLocation();
  const isActive =
    end || to === "/" ? pathname === to : pathname === to || pathname.startsWith(to + "/");
  const cls = typeof className === "function" ? className({ isActive }) : className;
  const kids = typeof children === "function" ? children({ isActive }) : children;
  return (
    <Link to={to} className={cls} aria-current={isActive ? "page" : undefined} {...rest}>
      {kids}
    </Link>
  );
}

export function Navigate({
  to,
  replace,
  state,
}: {
  to: string;
  replace?: boolean;
  state?: Record<string, unknown>;
}) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace, state });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);
  return null;
}
