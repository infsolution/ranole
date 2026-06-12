
-- RLS policies for user-uploads bucket
-- Path layout: {workspace_id}/{filename}
-- Authenticated users may upload/read/update/delete objects in workspaces they're members of.

CREATE POLICY "user_uploads_select_members" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'user-uploads'
  AND EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id::text = (storage.foldername(name))[1]
      AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "user_uploads_insert_members" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads'
  AND EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id::text = (storage.foldername(name))[1]
      AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "user_uploads_update_members" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'user-uploads'
  AND EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id::text = (storage.foldername(name))[1]
      AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "user_uploads_delete_members" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'user-uploads'
  AND EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id::text = (storage.foldername(name))[1]
      AND wm.user_id = auth.uid()
  )
);
