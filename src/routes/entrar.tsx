import { createFileRoute } from "@tanstack/react-router";
import Page from "@/app/pages/Login";


export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar · Achados e Perdidos Senac Canoas" },
      { name: "description", content: "Entre na sua conta do Achados e Perdidos." },
      { property: "og:title", content: "Entrar · Achados e Perdidos Senac Canoas" },
      { property: "og:description", content: "Entre na sua conta do Achados e Perdidos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Page />,
});
