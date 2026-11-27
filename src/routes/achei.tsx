import { createFileRoute } from "@tanstack/react-router";
import Page from "@/app/pages/ReportFound";
import RequireAuth from "@/app/auth/RequireAuth";

export const Route = createFileRoute("/achei")({
  head: () => ({
    meta: [
      { title: "Achei um objeto · Achados e Perdidos Senac Canoas" },
      { name: "description", content: "Registre um objeto que você encontrou no campus." },
      { property: "og:title", content: "Achei um objeto · Achados e Perdidos Senac Canoas" },
      { property: "og:description", content: "Registre um objeto que você encontrou no campus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Page />
    </RequireAuth>
  ),
});
