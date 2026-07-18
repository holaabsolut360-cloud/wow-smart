-- Payment proofs: Storage bucket + RLS, extended payment status flow, and
-- immutability of approved payments.

-- =========================================================================
-- 1. STORAGE BUCKET
-- =========================================================================
-- Created here via SQL so it doesn't require manual dashboard setup.
-- Private bucket: nothing is public. The app always hands out short-lived
-- signed URLs (see server/services/StorageService.ts), never a permanent
-- public link.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,
  10485760, -- 10MB hard ceiling at the bucket level; the app enforces a
            -- tighter, configurable limit via MAX_PROOF_FILE_SIZE_MB
            -- (default 5MB) before ever reaching Storage.
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =========================================================================
-- 2. PAYMENTS TABLE CHANGES
-- =========================================================================
-- Store only a reference to the file (its Storage path), never the file
-- itself, and never a permanent URL (the bucket is private -- URLs are
-- minted on demand and expire).
ALTER TABLE payments RENAME COLUMN proof_url TO proof_path;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT;

-- Extend the status flow: Pendiente -> En revisión -> Aprobado / Rechazado.
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments
  ADD CONSTRAINT payments_status_check
  CHECK (status IN ('Pendiente', 'En revisión', 'Aprobado', 'Rechazado'));

CREATE INDEX IF NOT EXISTS idx_payments_proof_path ON payments(proof_path);

-- Requirement #6: "No permitir modificar un pago aprobado." Enforced at the
-- application layer (PaymentService.getMutableOrThrow) AND here, so it
-- holds even if a future code path writes to this table directly.
CREATE OR REPLACE FUNCTION prevent_modify_approved_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'Aprobado' THEN
    RAISE EXCEPTION 'No se puede modificar un pago ya aprobado (payment id: %)', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_modify_approved_payment ON payments;
CREATE TRIGGER trg_prevent_modify_approved_payment
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION prevent_modify_approved_payment();

-- =========================================================================
-- 3. STORAGE RLS POLICIES
-- =========================================================================
-- Path layout: payment-proofs/{company_id}/{yyyy}/{mm}/{uuid}.{ext}
-- storage.foldername(name) returns the folder segments as an array, so
-- (storage.foldername(name))[1] is the company_id segment.
--
-- Note: the backend always uploads/reads through the Supabase
-- service-role key (bypasses RLS), so these policies are what actually
-- protect the bucket if anything ever calls Supabase Storage directly
-- from the browser with a user's JWT (defense in depth / future-proofing).

-- Read: SuperAdmin has no Supabase JWT (it authenticates via its own
-- signed cookie against the backend, which always uses the service-role
-- key), so it never needs a SELECT policy here -- it already bypasses RLS.
-- This policy covers the other required case: the company owner.
DROP POLICY IF EXISTS "payment_proofs_select_owner" ON storage.objects;
CREATE POLICY "payment_proofs_select_owner"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-proofs'
    AND EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id::text = (storage.foldername(name))[1]
        AND companies.user_id = auth.uid()
    )
  );

-- Write: only an authenticated user uploading into their OWN company's
-- folder (first path segment must equal a company they own).
DROP POLICY IF EXISTS "payment_proofs_insert_own_company" ON storage.objects;
CREATE POLICY "payment_proofs_insert_own_company"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id::text = (storage.foldername(name))[1]
        AND companies.user_id = auth.uid()
    )
  );

-- Delete: the owner may delete their own proof file ONLY while the
-- corresponding payment is still "Pendiente" (SuperAdmin deletion always
-- goes through the service-role key, which bypasses RLS entirely).
DROP POLICY IF EXISTS "payment_proofs_delete_owner_while_pending" ON storage.objects;
CREATE POLICY "payment_proofs_delete_owner_while_pending"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'payment-proofs'
    AND EXISTS (
      SELECT 1 FROM companies
      JOIN payments ON payments.company_id = companies.id
      WHERE companies.id::text = (storage.foldername(name))[1]
        AND companies.user_id = auth.uid()
        AND payments.proof_path = storage.objects.name
        AND payments.status = 'Pendiente'
    )
  );
