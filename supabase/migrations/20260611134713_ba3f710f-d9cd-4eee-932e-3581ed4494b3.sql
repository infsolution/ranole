CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_workspace_member(_workspace_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id AND user_id = _user_id
  )
$$;

REVOKE EXECUTE ON FUNCTION private.is_workspace_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_workspace_member(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS workspaces_member_read ON public.workspaces;
CREATE POLICY workspaces_member_read ON public.workspaces
  FOR SELECT TO authenticated
  USING (private.is_workspace_member(id, auth.uid()));

DROP POLICY IF EXISTS members_read_self_workspaces ON public.workspace_members;
CREATE POLICY members_read_self_workspaces ON public.workspace_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.is_workspace_member(workspace_id, auth.uid()));

DROP POLICY IF EXISTS pages_member_all ON public.pages;
CREATE POLICY pages_member_all ON public.pages
  FOR ALL TO authenticated
  USING (private.is_workspace_member(workspace_id, auth.uid()))
  WITH CHECK (private.is_workspace_member(workspace_id, auth.uid()));

DROP POLICY IF EXISTS page_versions_member ON public.page_versions;
CREATE POLICY page_versions_member ON public.page_versions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pages p WHERE p.id = page_versions.page_id AND private.is_workspace_member(p.workspace_id, auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pages p WHERE p.id = page_versions.page_id AND private.is_workspace_member(p.workspace_id, auth.uid())));

DROP POLICY IF EXISTS analytics_member_read ON public.analytics_events;
CREATE POLICY analytics_member_read ON public.analytics_events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pages p WHERE p.id = analytics_events.page_id AND private.is_workspace_member(p.workspace_id, auth.uid())));

DROP POLICY IF EXISTS members_read_subscription ON public.workspace_subscriptions;
CREATE POLICY members_read_subscription ON public.workspace_subscriptions
  FOR SELECT TO authenticated
  USING (private.is_workspace_member(workspace_id, auth.uid()));

DROP FUNCTION IF EXISTS public.is_workspace_member(uuid, uuid);