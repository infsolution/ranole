
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE;

CREATE TYPE public.subscription_plan AS ENUM ('free','pro','business');
CREATE TYPE public.subscription_status AS ENUM ('active','trialing','past_due','canceled','incomplete','incomplete_expired','unpaid','paused');
CREATE TYPE public.billing_cycle AS ENUM ('monthly','yearly');

CREATE TABLE public.workspace_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL UNIQUE,
  plan public.subscription_plan NOT NULL DEFAULT 'free',
  cycle public.billing_cycle,
  status public.subscription_status NOT NULL DEFAULT 'active',
  stripe_subscription_id text UNIQUE,
  stripe_price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  trial_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.workspace_subscriptions TO authenticated;
GRANT ALL ON public.workspace_subscriptions TO service_role;

ALTER TABLE public.workspace_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_read_subscription" ON public.workspace_subscriptions
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE TRIGGER trg_workspace_subscriptions_updated
  BEFORE UPDATE ON public.workspace_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed a free subscription for existing workspaces
INSERT INTO public.workspace_subscriptions (workspace_id, plan, status)
SELECT w.id, 'free', 'active' FROM public.workspaces w
ON CONFLICT (workspace_id) DO NOTHING;

-- Auto-create free subscription on new workspace
CREATE OR REPLACE FUNCTION public.create_free_subscription()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.workspace_subscriptions (workspace_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (workspace_id) DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_workspace_free_sub
  AFTER INSERT ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.create_free_subscription();
