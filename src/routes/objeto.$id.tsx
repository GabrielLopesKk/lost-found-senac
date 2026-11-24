import { createFileRoute } from "@tanstack/react-router";
import Page from "@/app/pages/ItemDetail";


export const Route = createFileRoute("/objeto/$id")({
  head: () => ({
    meta: [
      { title: "Objeto encontrado · Achados e Perdidos Senac Canoas" },
      { name: "description", content: "Detalhes de um objeto encontrado e como solicitar a retirada." },
      { property: "og:title", content: "Objeto encontrado · Achados e Perdidos Senac Canoas" },
      { property: "og:description", content: "Detalhes de um objeto encontrado e como solicitar a retirada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Page />,
});
