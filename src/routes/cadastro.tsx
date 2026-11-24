import { createFileRoute } from "@tanstack/react-router";
import Page from "@/app/pages/SignUp";


export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta · Achados e Perdidos Senac Canoas" },
      { name: "description", content: "Crie sua conta no Achados e Perdidos." },
      { property: "og:title", content: "Criar conta · Achados e Perdidos Senac Canoas" },
      { property: "og:description", content: "Crie sua conta no Achados e Perdidos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Page />,
});
