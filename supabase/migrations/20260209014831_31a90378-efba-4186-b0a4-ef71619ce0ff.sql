
-- Criar bucket quiz-media (publico para exibicao)
INSERT INTO storage.buckets (id, name, public)
VALUES ('quiz-media', 'quiz-media', true);

-- Politica: usuarios autenticados podem fazer upload
CREATE POLICY "Users upload quiz media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'quiz-media');

-- Politica: qualquer pessoa pode ver (publico)
CREATE POLICY "Public read quiz media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'quiz-media');

-- Politica: usuarios podem deletar seus proprios uploads
CREATE POLICY "Users delete own quiz media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'quiz-media' AND (auth.uid())::text = (storage.foldername(name))[1]);
