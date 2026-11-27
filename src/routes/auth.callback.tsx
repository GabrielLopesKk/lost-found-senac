import { createFileRoute } from "@tanstack/react-router";
import Page from "@/app/pages/AuthCallback";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Confirmando acesso · Achados e Perdidos Senac Canoas" },
      { name: "description", content: "Confirmando seu acesso." },
      { property: "og:title", content: "Confirmando acesso · Achados e Perdidos Senac Canoas" },
      { property: "og:description", content: "Confirmando seu acesso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Page />,
});
