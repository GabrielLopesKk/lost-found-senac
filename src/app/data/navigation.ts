type NavigationItem = {
  to: string;
  label: string;
  end?: boolean;
  staff?: boolean;
};

export const NAV: NavigationItem[] = [
  { to: "/", label: "Início", end: true },
  { to: "/procurar", label: "Procurar" },
  { to: "/achei", label: "Achei algo" },
  { to: "/perdi", label: "Perdi algo" },
  { to: "/admin", label: "Administração", staff: true },
];
