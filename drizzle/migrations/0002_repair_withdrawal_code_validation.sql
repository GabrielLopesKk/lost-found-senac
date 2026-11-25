ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS code_expires_at timestamptz;
CREATE OR REPLACE FUNCTION public.validate_pickup_code(p_code text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
DECLARE
 v_clean text := upper(regexp_replace(coalesce(p_code,''), '[[:space:]-]', '', 'g'));
 v_claim public.claims%rowtype;
 v_item public.items%rowtype;
BEGIN
 IF NOT public.is_staff() THEN RAISE EXCEPTION 'Acesso restrito à recepção.' USING errcode = '42501'; END IF;
 IF v_clean !~ '^[A-Z0-9]{8}$' THEN RAISE EXCEPTION 'O código deve ter 8 letras ou números (ex.: K7QM-4XPA).'; END IF;
 SELECT * INTO v_claim FROM public.claims
 WHERE code_hash = encode(extensions.digest(substr(v_clean,1,4)||'-'||substr(v_clean,5,4),'sha256'),'hex')
 FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Código não encontrado ou substituído. Confira o código mais recente.'; END IF;
 IF v_claim.code_used THEN RAISE EXCEPTION 'Este código já foi utilizado.'; END IF;
 IF v_claim.status <> 'Aprovada' THEN RAISE EXCEPTION 'Este código não é mais válido: a solicitação não está aprovada.'; END IF;
 IF v_claim.code_expires_at IS NOT NULL AND v_claim.code_expires_at <= now() THEN RAISE EXCEPTION 'Este código expirou. Gere um novo código na sua conta.'; END IF;
 SELECT * INTO v_item FROM public.items WHERE id = v_claim.item_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'O objeto desta solicitação não foi encontrado.'; END IF;
 IF v_item.status = 'Devolvido' THEN RAISE EXCEPTION 'Este objeto já foi devolvido.'; END IF;
 IF v_item.status <> 'Aguardando retirada' THEN RAISE EXCEPTION 'Este código não é mais válido: o objeto não está aguardando retirada.'; END IF;
 UPDATE public.claims SET code_used=true, picked_up_at=now() WHERE id=v_claim.id;
 UPDATE public.items SET status='Devolvido' WHERE id=v_item.id;
 RETURN json_build_object('itemRef',v_item.ref,'itemName',v_item.name,'claimant',v_claim.name);
END; $function$;
REVOKE ALL ON FUNCTION public.validate_pickup_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_pickup_code(text) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.issue_pickup_code(p_claim_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
DECLARE
 v_claim public.claims%rowtype;
 v_raw text;
 v_code text;
 v_status text;
BEGIN
 IF (SELECT auth.uid()) IS NULL THEN RAISE EXCEPTION 'Faça login para continuar.' USING errcode='42501'; END IF;
 SELECT * INTO v_claim FROM public.claims WHERE id=p_claim_id FOR UPDATE;
 IF NOT FOUND OR (v_claim.user_id <> (SELECT auth.uid()) AND NOT public.is_staff()) THEN RAISE EXCEPTION 'Solicitação não encontrada.'; END IF;
 IF v_claim.status <> 'Aprovada' OR v_claim.code_used THEN RAISE EXCEPTION 'Não é possível gerar código para esta solicitação.'; END IF;
 SELECT status INTO v_status FROM public.items WHERE id=v_claim.item_id FOR UPDATE;
 IF NOT FOUND OR v_status <> 'Aguardando retirada' THEN RAISE EXCEPTION 'O objeto não está disponível para retirada.'; END IF;
 LOOP
  v_raw := public.gen_ref('',8);
  v_code := substr(v_raw,1,4)||'-'||substr(v_raw,5,4);
  EXIT WHEN NOT EXISTS (SELECT 1 FROM public.claims WHERE code_hash=encode(extensions.digest(v_code,'sha256'),'hex'));
 END LOOP;
 UPDATE public.claims SET code_hash=encode(extensions.digest(v_code,'sha256'),'hex'), code_issued_at=now(), code_expires_at=null WHERE id=p_claim_id;
 RETURN v_code;
END; $function$;
REVOKE ALL ON FUNCTION public.issue_pickup_code(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.issue_pickup_code(uuid) TO authenticated, service_role;