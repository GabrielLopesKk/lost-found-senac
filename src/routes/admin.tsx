import { createFileRoute } from "@tanstack/react-router";
import Page from "@/app/pages/Admin";
import RequireAuth from "@/app/auth/RequireAuth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Recepção · Achados e Perdidos Senac Canoas" },
      { name: "description", content: "Painel da equipe da recepção." },
      { property: "og:title", content: "Recepção · Achados e Perdidos Senac Canoas" },
      { property: "og:description", content: "Painel da equipe da recepção." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RequireAuth staff><Page /></RequireAuth>,
});
