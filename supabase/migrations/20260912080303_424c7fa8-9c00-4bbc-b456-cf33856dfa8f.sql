CREATE POLICY "Service role manages analysis rate limits"
ON public.analysis_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);