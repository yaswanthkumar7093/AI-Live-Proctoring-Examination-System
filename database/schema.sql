-- AI Live Proctoring Examination System Database Schema (Custom Auth Version)

-- DROP existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- DROP existing tables to ensure clean schema (WARNING: Clears data)
DROP TABLE IF EXISTS public.exam_sessions CASCADE;
DROP TABLE IF EXISTS public.exams CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. Profiles Table (Now acts as our main Users table)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'proctor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles (Custom Auth means our backend handles access, so we can allow service role/anon to operate via our backend)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow all access for now since our backend acts as the gatekeeper using the anon key
CREATE POLICY "Enable all for profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- 2. Exams Table
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for exams" ON public.exams FOR ALL USING (true) WITH CHECK (true);

-- 3. Exam Sessions Table (Live Proctoring Data)
CREATE TABLE IF NOT EXISTS public.exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'terminated')),
  video_url TEXT, -- URL to recording if stored
  flags_count INTEGER DEFAULT 0, -- Number of suspicious activities detected by AI
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);

ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for sessions" ON public.exam_sessions FOR ALL USING (true) WITH CHECK (true);
