
INSERT INTO storage.buckets (id, name, public) VALUES ('webhook-assets', 'webhook-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for webhook assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'webhook-assets');
