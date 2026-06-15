-- Restrict access to sensitive workspace columns (stripe_customer_id, custom_domain_verification_token)
-- by removing column-level SELECT privileges for the authenticated and anon roles.
REVOKE SELECT ON public.workspaces FROM authenticated;
REVOKE SELECT ON public.workspaces FROM anon;

GRANT SELECT (
  id,
  owner_id,
  name,
  slug,
  created_at,
  updated_at,
  custom_domain,
  custom_domain_status,
  custom_domain_verified_at
) ON public.workspaces TO authenticated;

-- Keep full write privileges for owners (RLS still enforces ownership)
GRANT INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;