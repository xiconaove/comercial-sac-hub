
-- Create storage bucket for SAC attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('sac-attachments', 'sac-attachments', true);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload sac attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'sac-attachments');

-- Allow anyone to view sac attachments (public bucket)
CREATE POLICY "Anyone can view sac attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'sac-attachments');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Authenticated users can delete sac attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'sac-attachments');
