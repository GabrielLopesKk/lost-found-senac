import { createFileRoute } from "@tanstack/react-router";
import Page from "@/app/pages/ResetPassword";


export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [
      { title: "Redefinir senha · Achados e Perdidos Senac Canoas" },
      { name: "description", content: "Escolha uma nova senha para sua conta." },
      { property: "og:title", content: "Redefinir senha · Achados e Perdidos Senac Canoas" },
      { property: "og:description", content: "Escolha uma nova senha para sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Page />,
});
