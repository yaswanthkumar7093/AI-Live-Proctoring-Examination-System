-- SQL Schema Setup for AI Live Proctoring Examination System
-- Run this script in your Supabase SQL Editor.

-- Enable uuid-ossp extension if not already enabled (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create Policies (Since we're using a custom server-side backend with service role client,
-- direct client access is blocked by RLS by default. If we wanted to allow public read/write
-- we would configure specific policies. For custom API-based auth, keeping RLS enabled without 
-- broad public policies is secure because our service_role key bypasses RLS.)

-- Create index on email for faster lookup
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
