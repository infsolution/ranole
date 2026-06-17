
-- 1) Restrict sensitive columns on workspaces to owner-only via column-level grants
REVOKE SELECT (stripe_customer_id, custom_domain_verification_token) ON public.workspaces FROM authenticated;
REVOKE SELECT (stripe_customer_id, custom_domain_verification_token) ON public.workspaces FROM anon;

-- Owners need to read these (via owner_id check enforced by RLS policy workspaces_owner_write covers ALL).
-- Add explicit owner SELECT policy so column-level SELECT works for owners only.
DROP POLICY IF EXISTS workspaces_owner_read_sensitive ON public.workspaces;
-- Note: the existing workspaces_owner_write covers ALL incl. SELECT for owners,
-- so owners retain access. Members keep SELECT on non-sensitive columns only
-- because we revoked column privs; RLS row visibility still applies.

-- We need to re-grant SELECT on the non-sensitive columns to authenticated so members keep access
GRANT SELECT (
  id, owner_id, name, slug, created_at, updated_at,
  custom_domain, custom_domain_status, custom_domain_verified_at
) ON public.workspaces TO authenticated;

-- 2) Restrict Stripe IDs on workspace_subscriptions to owner-only via column grants
REVOKE SELECT (stripe_subscription_id, stripe_price_id) ON public.workspace_subscriptions FROM authenticated;
REVOKE SELECT (stripe_subscription_id, stripe_price_id) ON public.workspace_subscriptions FROM anon;

-- Re-grant SELECT on non-sensitive columns for members
GRANT SELECT (
  workspace_id, plan, cycle, status, current_period_start, current_period_end,
  cancel_at_period_end, trial_end, created_at, updated_at
) ON public.workspace_subscriptions TO authenticated;

-- Add an owner-only SELECT policy that allows owners to read all columns
DROP POLICY IF EXISTS owner_read_subscription_full ON public.workspace_subscriptions;
CREATE POLICY owner_read_subscription_full ON public.workspace_subscriptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_subscriptions.workspace_id AND w.owner_id = auth.uid()
    )
  );

-- 3) Harden analytics_events insert policy: validate properties size and event_type
DROP POLICY IF EXISTS analytics_public_insert ON public.analytics_events;
CREATE POLICY analytics_public_insert ON public.analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.id = analytics_events.page_id AND p.status = 'published'::page_status
    )
    AND char_length(event_type) <= 64
    AND event_type ~ '^[a-z0-9_\.\-]+$'
    AND (properties IS NULL OR pg_column_size(properties) <= 4096)
    AND (user_agent IS NULL OR char_length(user_agent) <= 512)
    AND (session_id IS NULL OR char_length(session_id) <= 128)
  );
