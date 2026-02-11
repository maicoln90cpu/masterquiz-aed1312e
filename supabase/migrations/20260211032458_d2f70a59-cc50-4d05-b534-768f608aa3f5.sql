CREATE POLICY "Anyone can read tracking settings"
  ON public.system_settings
  FOR SELECT
  USING (setting_key IN ('gtm_container_id', 'facebook_pixel_id', 'require_cookie_consent'));