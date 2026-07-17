ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_insert_own" ON companies;
CREATE POLICY "companies_insert_own"
  ON companies FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "companies_update_own" ON companies;
CREATE POLICY "companies_update_own"
  ON companies FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
