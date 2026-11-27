import { createFileRoute } from "@tanstack/react-router";
import Page from "@/app/pages/ForgotPassword";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha · Achados e Perdidos Senac Canoas" },
      { name: "description", content: "Receba um link para redefinir sua senha." },
      { property: "og:title", content: "Recuperar senha · Achados e Perdidos Senac Canoas" },
      { property: "og:description", content: "Receba um link para redefinir sua senha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Page />,
});
