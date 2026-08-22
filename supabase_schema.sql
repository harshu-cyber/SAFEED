-- ============================================================
-- SAFEED-UP — Supabase Single Source of Truth Production Schema
-- Production PostgreSQL DDL, RLS Policies, & Automated Triggers
-- Paste this entire SQL into Supabase SQL Editor and Click RUN
-- Fully Idempotent (Can be re-run unlimited times safely)
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'DISTRICT_ADMIN', 'INSPECTION_OFFICER', 'INSTITUTION_ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE institution_type AS ENUM ('COACHING', 'SCHOOL', 'COLLEGE', 'UNIVERSITY', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE document_type AS ENUM ('FIRE_SAFETY', 'BUILDING_STRUCTURAL_SAFETY', 'ELECTRICAL_SAFETY', 'EVACUATION_PLAN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE doc_status AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'INSTITUTION_ADMIN',
  name TEXT,
  phone TEXT,
  district TEXT,
  zone TEXT,
  institution_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INSTITUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  safe_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  institution_type institution_type NOT NULL DEFAULT 'SCHOOL',
  address TEXT NOT NULL,
  district TEXT NOT NULL,
  zone TEXT,
  police_station TEXT,
  principal_name TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  compliance_score INT DEFAULT 0,
  verification_status verification_status DEFAULT 'PENDING',
  assigned_inspector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  qr_locked BOOLEAN DEFAULT true,
  qr_lock_notice TEXT,
  qr_locked_by TEXT,
  qr_locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key back to profiles for institution_id
DO $$ BEGIN
  ALTER TABLE public.profiles 
  ADD CONSTRAINT fk_profiles_institution 
  FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 5. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  original_file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'safeed-documents',
  file_size BIGINT,
  mime_type TEXT,
  status doc_status NOT NULL DEFAULT 'PENDING_REVIEW',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (institution_id, document_type)
);

-- 5B. COMPLAINTS TABLE (Citizen Safety Reporting)
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_ticket TEXT NOT NULL UNIQUE,
  complainant_name TEXT NOT NULL,
  complainant_phone TEXT NOT NULL,
  district TEXT NOT NULL,
  zone TEXT,
  institution_name TEXT NOT NULL,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_DISTRICT_ACTION',
  assigned_inspector TEXT,
  district_directives TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5C. EVIDENCE TABLE (Inspector Site Inspection Photos & Evidence)
CREATE TABLE IF NOT EXISTS public.evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  inspector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  photo_url TEXT NOT NULL,
  storage_path TEXT,
  category TEXT DEFAULT 'SITE_INSPECTION',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AUTOMATED QR COMPLIANCE TRIGGER & FUNCTION
CREATE OR REPLACE FUNCTION public.evaluate_institution_compliance()
RETURNS TRIGGER AS $$
DECLARE
  approved_count INT;
  target_inst_id UUID;
BEGIN
  target_inst_id := NEW.institution_id;

  SELECT COUNT(*) INTO approved_count
  FROM public.documents
  WHERE institution_id = target_inst_id AND status = 'APPROVED';

  IF approved_count >= 4 THEN
    UPDATE public.institutions
    SET 
      compliance_score = 100,
      verification_status = 'VERIFIED',
      qr_locked = false,
      qr_lock_notice = NULL,
      updated_at = NOW()
    WHERE id = target_inst_id;
  ELSE
    UPDATE public.institutions
    SET 
      compliance_score = (approved_count * 25),
      verification_status = CASE WHEN approved_count > 0 THEN 'UNDER_REVIEW' ELSE 'PENDING' END,
      updated_at = NOW()
    WHERE id = target_inst_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_evaluate_compliance ON public.documents;
CREATE TRIGGER trg_evaluate_compliance
AFTER INSERT OR UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.evaluate_institution_compliance();

-- 7. PROFILE CREATION TRIGGER ON AUTH SIGNUP (WITH SECURITY ROLE SANITIZATION)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role user_role;
  user_name TEXT;
  user_phone TEXT;
  user_district TEXT;
  user_zone TEXT;
  user_inst_id UUID;
BEGIN
  assigned_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'INSTITUTION_ADMIN');
  
  -- Security Guard: Prevent public signup from assigning SUPER_ADMIN or administrative roles
  IF (NEW.raw_user_meta_data->>'role') IN ('SUPER_ADMIN', 'DISTRICT_ADMIN', 'INSPECTION_OFFICER') THEN
    -- If user is NOT the pre-configured super admin seed, force role to INSTITUTION_ADMIN
    IF NEW.email != 'admin@safeed.gov.in' THEN
      assigned_role := 'INSTITUTION_ADMIN';
    END IF;
  END IF;

  user_name := NEW.raw_user_meta_data->>'name';
  user_phone := NEW.raw_user_meta_data->>'phone';
  user_district := NEW.raw_user_meta_data->>'district';
  user_zone := NEW.raw_user_meta_data->>'zone';
  user_inst_id := (NEW.raw_user_meta_data->>'institution_id')::UUID;

  -- Auto-confirm email for Super Admin seed to bypass email confirmation gate
  IF NEW.email = 'admin@safeed.gov.in' THEN
    UPDATE auth.users SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()) WHERE id = NEW.id;
  END IF;

  INSERT INTO public.profiles (id, email, role, name, phone, district, zone, institution_id)
  VALUES (NEW.id, NEW.email, assigned_role, user_name, user_phone, user_district, user_zone, user_inst_id)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    district = EXCLUDED.district,
    zone = EXCLUDED.zone,
    institution_id = EXCLUDED.institution_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 8. ROW LEVEL SECURITY (RLS) POLICIES (WITH IDEMPOTENT DROPS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Public profiles reading" ON public.profiles;
CREATE POLICY "Public profiles reading" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- INSTITUTIONS POLICIES
DROP POLICY IF EXISTS "Public institutions reading for verification" ON public.institutions;
CREATE POLICY "Public institutions reading for verification" ON public.institutions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins & Inspectors can manage institutions" ON public.institutions;
CREATE POLICY "Admins & Inspectors can manage institutions" ON public.institutions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('SUPER_ADMIN', 'DISTRICT_ADMIN', 'INSPECTION_OFFICER')
  )
);

DROP POLICY IF EXISTS "Institutions can update own profile" ON public.institutions;
CREATE POLICY "Institutions can update own profile" ON public.institutions FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.institution_id = public.institutions.id
  )
);

-- DOCUMENTS POLICIES
DROP POLICY IF EXISTS "Public reading for verification" ON public.documents;
CREATE POLICY "Public reading for verification" ON public.documents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
CREATE POLICY "Users can insert own documents" ON public.documents FOR INSERT WITH CHECK (
  auth.uid() = uploaded_by
);

DROP POLICY IF EXISTS "Inspectors & Admins can review documents" ON public.documents;
CREATE POLICY "Inspectors & Admins can review documents" ON public.documents FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('SUPER_ADMIN', 'DISTRICT_ADMIN', 'INSPECTION_OFFICER')
  )
);

-- COMPLAINTS POLICIES
DROP POLICY IF EXISTS "Anyone can submit public complaints" ON public.complaints;
CREATE POLICY "Anyone can submit public complaints" ON public.complaints FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public reading for complaints" ON public.complaints;
CREATE POLICY "Public reading for complaints" ON public.complaints FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins & Inspectors manage complaints" ON public.complaints;
CREATE POLICY "Admins & Inspectors manage complaints" ON public.complaints FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('SUPER_ADMIN', 'DISTRICT_ADMIN', 'INSPECTION_OFFICER')
  )
);

-- EVIDENCE POLICIES
DROP POLICY IF EXISTS "Authenticated users upload evidence" ON public.evidence;
CREATE POLICY "Authenticated users upload evidence" ON public.evidence FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Public reading for evidence" ON public.evidence;
CREATE POLICY "Public reading for evidence" ON public.evidence FOR SELECT USING (true);

-- 9. SUPABASE STORAGE BUCKET CREATION (SAFEED-DOCUMENTS)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('safeed-documents', 'safeed-documents', false)
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES
DROP POLICY IF EXISTS "Authenticated users upload documents" ON storage.objects;
CREATE POLICY "Authenticated users upload documents" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'safeed-documents' AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated users read documents" ON storage.objects;
CREATE POLICY "Authenticated users read documents" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'safeed-documents' AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated users update documents" ON storage.objects;
CREATE POLICY "Authenticated users update documents" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'safeed-documents' AND auth.role() = 'authenticated'
);

-- ============================================================
-- 10. SUPER ADMIN PROFILE ROLE ENFORCEMENT
-- Ensures any existing or newly registered admin@safeed.gov.in has SUPER_ADMIN role
-- ============================================================
DO $$
BEGIN
  -- Clean up any raw SQL inserted auth.users row that used improper bcrypt hashes
  DELETE FROM auth.users WHERE email = 'admin@safeed.gov.in' AND (encrypted_password LIKE '$2a$%' OR encrypted_password IS NULL);
  DELETE FROM public.profiles WHERE email = 'admin@safeed.gov.in' AND NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@safeed.gov.in');
  
  -- If super admin exists in auth.users, ensure profiles role is SUPER_ADMIN
  UPDATE public.profiles
  SET role = 'SUPER_ADMIN', name = 'State Director Super Admin', updated_at = NOW()
  WHERE email = 'admin@safeed.gov.in';
END $$;
