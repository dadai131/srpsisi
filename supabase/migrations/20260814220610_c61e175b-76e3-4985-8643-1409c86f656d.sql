-- 1. site_settings: leitura pública apenas de chaves não sensíveis
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;

CREATE POLICY "Public can view non-sensitive site settings"
ON public.site_settings
FOR SELECT
USING (setting_key IN ('theme', 'hero', 'categories'));

-- 2. site_statistics: escrita apenas via service_role (edge functions), leitura admin
GRANT SELECT ON public.site_statistics TO authenticated;
GRANT ALL ON public.site_statistics TO service_role;

CREATE POLICY "Service role can insert statistics"
ON public.site_statistics
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update statistics"
ON public.site_statistics
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Funções SECURITY DEFINER não devem ser chamáveis pela API pública
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;