import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-local-dev-key';

app.use(cors());
app.use(express.json());

// ─── Auth Middleware ───────────────────────────────────────────────
const requireAuth = (req: any, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ─── Auth Routes ───────────────────────────────────────────────────
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).single();
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    const { data: newUser, error } = await supabase.from('profiles')
      .insert({ email, password_hash, first_name, last_name })
      .select('id, email, first_name, last_name, role').single();

    if (error) throw error;

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user: newUser, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const { data: user, error } = await supabase.from('profiles').select('*').eq('email', email).single();
    if (error || !user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    delete user.password_hash;
    res.status(200).json({ user, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Exam Routes ───────────────────────────────────────────────────
app.get('/api/exams', requireAuth, async (req: any, res: Response) => {
  try {
    const { data, error } = await supabase.from('exams').select('*');
    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(200).json([
        { id: '11111111-1111-1111-1111-111111111111', title: 'Advanced Machine Learning', duration_minutes: 120 },
        { id: '22222222-2222-2222-2222-222222222222', title: 'Data Structures & Algorithms', duration_minutes: 90 }
      ]);
    }
    res.status(200).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/exams/:id', requireAuth, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('exams').select('*').eq('id', id).single();
    if (error) return res.status(404).json({ error: 'Exam not found' });
    res.status(200).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/exams/:id/start', requireAuth, async (req: any, res: Response) => {
  try {
    const { id: exam_id } = req.params;
    const student_id = req.user?.id;
    const { data, error } = await supabase.from('exam_sessions')
      .insert({ exam_id, student_id, status: 'in_progress', started_at: new Date().toISOString() })
      .select().single();
    if (error) return res.status(200).json({ message: 'Exam started', session: { id: 'mock-session' } });
    res.status(201).json({ message: 'Exam started', session: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/exams/:id/submit', requireAuth, async (req: any, res: Response) => {
  try {
    const { id: exam_id } = req.params;
    const student_id = req.user?.id;
    const { flags_count } = req.body;
    await supabase.from('exam_sessions')
      .update({ status: 'completed', ended_at: new Date().toISOString(), flags_count })
      .eq('exam_id', exam_id).eq('student_id', student_id);
    res.status(200).json({ message: 'Exam submitted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Health Check ──────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});

export default app;
