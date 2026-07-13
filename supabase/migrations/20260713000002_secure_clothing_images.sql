-- Private clothing photos. Photos are optional; only the owner can access
-- objects inside their auth.uid()-prefixed folder.
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'clothing-images',
  'clothing-images',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Owners can read clothing images" ON storage.objects;
CREATE POLICY "Owners can read clothing images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'clothing-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Owners can upload clothing images" ON storage.objects;
CREATE POLICY "Owners can upload clothing images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'clothing-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Owners can update clothing images" ON storage.objects;
CREATE POLICY "Owners can update clothing images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'clothing-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'clothing-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Owners can delete clothing images" ON storage.objects;
CREATE POLICY "Owners can delete clothing images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'clothing-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
