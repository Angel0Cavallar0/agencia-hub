-- Create storage policies for 'whatsapp' bucket
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload to whatsapp bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'whatsapp');

-- Allow authenticated users to read files
CREATE POLICY "Authenticated users can view whatsapp files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'whatsapp');

-- Allow authenticated users to update their files
CREATE POLICY "Authenticated users can update whatsapp files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'whatsapp');

-- Allow authenticated users to delete their files
CREATE POLICY "Authenticated users can delete whatsapp files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'whatsapp');