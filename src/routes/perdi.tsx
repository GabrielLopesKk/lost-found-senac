import { createFileRoute } from "@tanstack/react-router";
import Page from "@/app/pages/ReportLost";
import RequireAuth from "@/app/auth/RequireAuth";

export const Route = createFileRoute("/perdi")({
  head: () => ({
    meta: [
      { title: "Perdi um objeto · Achados e Perdidos Senac Canoas" },
      { name: "description", content: "Relate um objeto perdido e seja avisado de possíveis correspondências." },
      { property: "og:title", content: "Perdi um objeto · Achados e Perdidos Senac Canoas" },
      { property: "og:description", content: "Relate um objeto perdido e seja avisado de possíveis correspondências." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RequireAuth><Page /></RequireAuth>,
});
