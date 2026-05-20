-- SQL Schema Setup for AI Live Proctoring Examination System
-- Run this script in your Supabase SQL Editor.

-- Enable uuid-ossp extension if not already enabled (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Users Table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create index on email for faster lookup
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- 2. Exams Table
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INT NOT NULL, -- Duration in minutes
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Exams Table
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- 3. Exam Sessions Table
CREATE TABLE IF NOT EXISTS public.exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) DEFAULT 'started' CHECK (status IN ('started', 'completed')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_active_session UNIQUE (user_id, exam_id, status)
);

-- Enable RLS for Exam Sessions Table
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;

-- 4. Proctoring Logs Table
CREATE TABLE IF NOT EXISTS public.proctoring_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.exam_sessions(id) ON DELETE CASCADE NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- e.g., 'face_missing', 'multiple_faces', 'tab_switch', 'looking_away', 'webcam_disconnected'
    details TEXT,
    is_suspicious BOOLEAN DEFAULT TRUE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Proctoring Logs Table
ALTER TABLE public.proctoring_logs ENABLE ROW LEVEL SECURITY;

-- 5. Alerts Table
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.exam_sessions(id) ON DELETE CASCADE NOT NULL,
    log_id UUID REFERENCES public.proctoring_logs(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Alerts Table
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
