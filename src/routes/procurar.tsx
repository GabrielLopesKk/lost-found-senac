import { createFileRoute } from "@tanstack/react-router";
import Page from "@/app/pages/Search";


export const Route = createFileRoute("/procurar")({
  head: () => ({
    meta: [
      { title: "Procurar objetos · Achados e Perdidos Senac Canoas" },
      { name: "description", content: "Busque objetos encontrados no campus do Senac Canoas." },
      { property: "og:title", content: "Procurar objetos · Achados e Perdidos Senac Canoas" },
      { property: "og:description", content: "Busque objetos encontrados no campus do Senac Canoas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Page />,
});
