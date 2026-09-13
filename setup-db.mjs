import { neon } from '@neondatabase/serverless';

const DB_URL = 'postgresql://neondb_owner:npg_n25tWkIPGEha@ep-holy-hill-axl5kze2-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(DB_URL);

try {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sql`
    CREATE TABLE IF NOT EXISTS public.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email)`;

  await sql`
    CREATE TABLE IF NOT EXISTS public.exams (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      duration INT NOT NULL,
      created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS public.exam_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
      exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
      status VARCHAR(50) DEFAULT 'started' CHECK (status IN ('started', 'completed')),
      started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      completed_at TIMESTAMP WITH TIME ZONE,
      CONSTRAINT unique_active_session UNIQUE (user_id, exam_id, status)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS public.proctoring_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID REFERENCES public.exam_sessions(id) ON DELETE CASCADE NOT NULL,
      event_type VARCHAR(50) NOT NULL,
      details TEXT,
      is_suspicious BOOLEAN DEFAULT TRUE,
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS public.alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID REFERENCES public.exam_sessions(id) ON DELETE CASCADE NOT NULL,
      log_id UUID REFERENCES public.proctoring_logs(id) ON DELETE CASCADE NOT NULL,
      message TEXT NOT NULL,
      severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
      is_resolved BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    )
  `;

  console.log('✅ All 5 tables created successfully in Neon PostgreSQL!');
} catch (e) {
  console.error('❌ Schema error:', e.message);
  process.exit(1);
}
