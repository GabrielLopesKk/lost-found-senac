import {
  useLocation as useTsLocation,
  useParams as useTsParams,
  useRouter,
} from "@tanstack/react-router";

type NavOpts = { replace?: boolean | undefined; state?: Record<string, unknown> | undefined };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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
  const state = isRecord(loc.state) ? loc.state : {};
  return {
    pathname: loc.pathname,
    search: loc.searchStr,
    hash: loc.hash,
    state,
  };
}

export function useParams() {
  return useTsParams({ strict: false }) as Record<string, string>;
}

type SearchParamsUpdate = URLSearchParams | string | Record<string, string> | string[][];
type SearchParamsSetter = (
  next: SearchParamsUpdate | ((current: URLSearchParams) => SearchParamsUpdate),
  opts?: NavOpts,
) => void;

export function useSearchParams(): [URLSearchParams, SearchParamsSetter] {
  const loc = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(loc.search);
  const set: SearchParamsSetter = (next, opts = {}) => {
    const value = typeof next === "function" ? next(new URLSearchParams(loc.search)) : next;
    const qs = new URLSearchParams(value).toString();
    navigate(loc.pathname + (qs ? `?${qs}` : ""), opts);
  };
  return [params, set] as const;
}
