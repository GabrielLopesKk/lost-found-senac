import { useState, type FormEvent } from "react";
import type { AuthError } from "@supabase/supabase-js";
import { Link, Navigate } from "@/app/lib/router-compat";
import { useLocation, useNavigate } from "@/app/lib/router-hooks";
import { MailCheck } from "lucide-react";
import { supabase, authRedirectUrl, rememberNextPath } from "../lib/supabase";
import { useAuth } from "../auth/auth-context";
import AuthCard, { FormError } from "../components/AuthCard";
import { Button, Field } from "../components/ui";
import { getRedirectPath } from "../lib/router-utils";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function signUpError(error: AuthError) {
  if (error.code === "weak_password")
    return "Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.";
  if (error.code === "email_address_invalid")
    return "Este e-mail não é aceito. Use outro endereço.";
  if (error.status === 429 || error.code?.startsWith("over_"))
    return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
  if (error.code === "signup_disabled") return "Novos cadastros estão desativados no momento.";
  return "Não foi possível criar a conta agora. Tente novamente em instantes.";
}

export default function SignUp() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = getRedirectPath(location.state, "/minha-conta");
  type SignUpForm = {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirm: string;
  };
  type SignUpField = keyof SignUpForm;
  const [form, setForm] = useState<SignUpForm>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Partial<Record<SignUpField, string>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const set = (key: SignUpField, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  if (!loading && user && !sentTo) return <Navigate to={from} replace />;

  function validate() {
    const e: Partial<Record<SignUpField, string>> = {};
    if (form.fullName.trim().length < 2) e.fullName = "Informe seu nome.";
    if (!EMAIL_RE.test(form.email.trim())) e.email = "E-mail inválido.";
    const phone = form.phone.replace(/\D/g, "");
    if (phone && (phone.length < 10 || phone.length > 11))
      e.phone = "Use DDD + número (10 ou 11 dígitos).";
    if (form.password.length < 8) e.password = "Use pelo menos 8 caracteres.";
    if (form.confirm !== form.password) e.confirm = "As senhas não coincidem.";
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setBusy(true);
    rememberNextPath(from);
    const { data, error: err } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: authRedirectUrl(),
        data: { full_name: form.fullName.trim(), phone: form.phone.replace(/\D/g, "") },
      },
    });
    setBusy(false);
    if (err) return setError(signUpError(err));
    if (data.session) return navigate(from, { replace: true });
    setSentTo(form.email.trim());
  }

  if (sentTo) {
    return (
      <AuthCard eyebrow="Quase lá" title="Confirme seu e-mail">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-flame-50 text-flame-600">
            <MailCheck className="size-7" />
          </div>
          <p className="text-sm text-muted">
            Se o endereço <strong className="text-navy-900">{sentTo}</strong> estiver disponível,
            enviamos um link de confirmação. Abra-o para ativar sua conta e depois entre com sua
            senha.
          </p>
          <Link to="/entrar" className="mt-2 font-semibold text-flame-600 underline">
            Ir para o login
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="Criar conta"
      title="Cadastre-se"
      subtitle="Seus dados de contato nunca aparecem publicamente."
      footer={
        <>
          Já tem conta?{" "}
          <Link
            to="/entrar"
            state={location.state}
            className="font-semibold text-flame-600 underline"
          >
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Nome completo" required error={errors.fullName}>
          <input
            className="input"
            autoComplete="name"
            maxLength={120}
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
          />
        </Field>
        <Field label="E-mail" required error={errors.email}>
          <input
            type="email"
            className="input"
            autoComplete="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field label="Telefone" error={errors.phone} hint="Opcional. Com DDD, só números.">
          <input
            type="tel"
            inputMode="numeric"
            className="input"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Senha" required error={errors.password}>
            <input
              type="password"
              className="input"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
          </Field>
          <Field label="Confirmar senha" required error={errors.confirm}>
            <input
              type="password"
              className="input"
              autoComplete="new-password"
              value={form.confirm}
              onChange={(e) => set("confirm", e.target.value)}
            />
          </Field>
        </div>
        <FormError>{error}</FormError>
        <Button type="submit" loading={busy} className="w-full">
          Criar conta
        </Button>
      </form>
    </AuthCard>
  );
}
