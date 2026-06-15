
ALTER TABLE public.workspaces
  ADD COLUMN custom_domain TEXT UNIQUE,
  ADD COLUMN custom_domain_status TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN custom_domain_verification_token TEXT,
  ADD COLUMN custom_domain_verified_at TIMESTAMPTZ;

ALTER TABLE public.workspaces
  ADD CONSTRAINT workspaces_custom_domain_format
  CHECK (custom_domain IS NULL OR custom_domain ~* '^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)+$');

ALTER TABLE public.workspaces
  ADD CONSTRAINT workspaces_custom_domain_status_check
  CHECK (custom_domain_status IN ('none','pending','verifying','active','failed'));
