import { createFileRoute } from "@tanstack/react-router";
import Page from "@/app/pages/Home";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Achados e Perdidos · Senac Canoas" },
      { name: "description", content: "Achados e Perdidos do Senac Canoas: encontre, registre e recupere objetos no campus." },
      { property: "og:title", content: "Início · Achados e Perdidos Senac Canoas" },
      { property: "og:description", content: "Achados e Perdidos do Senac Canoas: encontre, registre e recupere objetos no campus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Page />,
});
