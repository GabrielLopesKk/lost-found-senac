import { createFileRoute } from "@tanstack/react-router";
import Page from "@/app/pages/Account";
import RequireAuth from "@/app/auth/RequireAuth";

export const Route = createFileRoute("/minha-conta")({
  head: () => ({
    meta: [
      { title: "Minha conta · Achados e Perdidos Senac Canoas" },
      { name: "description", content: "Seus relatos, objetos registrados e solicitações de retirada." },
      { property: "og:title", content: "Minha conta · Achados e Perdidos Senac Canoas" },
      { property: "og:description", content: "Seus relatos, objetos registrados e solicitações de retirada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RequireAuth><Page /></RequireAuth>,
});
