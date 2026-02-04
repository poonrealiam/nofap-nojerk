-- Email OTP table for verification-code login (no password)
-- Run this in Supabase SQL Editor if you use verification code login.

CREATE TABLE IF NOT EXISTS public.email_otp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_otp_email_expires ON public.email_otp(email, expires_at);

ALTER TABLE public.email_otp ENABLE ROW LEVEL SECURITY;

-- Allow anonymous to insert (request OTP) and select by email+code for verification (done in Edge Function with service role)
CREATE POLICY "Allow insert for any" ON public.email_otp FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete for any" ON public.email_otp FOR DELETE WITH CHECK (true);
CREATE POLICY "Allow select for any" ON public.email_otp FOR SELECT USING (true);

COMMENT ON TABLE public.email_otp IS 'One-time codes for email verification login; verified by Edge Function.';
