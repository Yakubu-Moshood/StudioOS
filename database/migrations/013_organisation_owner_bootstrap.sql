-- Allow an organisation owner to read and manage the organisation before the
-- corresponding membership row is inserted during first-project bootstrap.

DROP POLICY IF EXISTS organisations_member_access ON public.organisations;

CREATE POLICY organisations_member_access ON public.organisations
  FOR ALL
  USING (owner_id = auth.uid() OR public.is_organisation_member(id))
  WITH CHECK (owner_id = auth.uid());
