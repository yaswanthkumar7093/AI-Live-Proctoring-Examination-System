import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getExams = async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase.from('exams').select('*');
    if (error) throw error;

    // If db is empty, return some placeholder data for testing
    if (data.length === 0) {
      return res.status(200).json([
        { id: '11111111-1111-1111-1111-111111111111', title: 'Advanced Machine Learning', duration_minutes: 120, status: 'available' },
        { id: '22222222-2222-2222-2222-222222222222', title: 'Data Structures & Algorithms', duration_minutes: 90, status: 'upcoming' }
      ]);
    }

    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getExamById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('exams').select('*').eq('id', id).single();
    
    if (error) {
      // Mock fallback if DB is not setup yet
      if (id === '11111111-1111-1111-1111-111111111111') {
        return res.status(200).json({ id, title: 'Advanced Machine Learning', duration_minutes: 120, status: 'available' });
      }
      throw error;
    }

    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const startExamSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id: exam_id } = req.params;
    const student_id = req.user?.id;

    if (!student_id) return res.status(401).json({ error: 'Unauthorized' });

    // Try to insert a session. If it fails (e.g. table not created), return a mock success
    const { data, error } = await supabase.from('exam_sessions').insert({
      exam_id,
      student_id,
      status: 'in_progress',
      started_at: new Date().toISOString()
    }).select().single();

    if (error) {
      console.warn("Could not insert session (DB may not be setup). Mocking start.");
      return res.status(200).json({ message: 'Exam started successfully (Mocked)', session: { id: 'mock-session-id' } });
    }

    res.status(201).json({ message: 'Exam started', session: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const submitExamSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id: exam_id } = req.params;
    const student_id = req.user?.id;
    const { flags_count } = req.body; // Mock AI flags

    if (!student_id) return res.status(401).json({ error: 'Unauthorized' });

    const { data, error } = await supabase.from('exam_sessions')
      .update({ status: 'completed', ended_at: new Date().toISOString(), flags_count })
      .eq('exam_id', exam_id)
      .eq('student_id', student_id)
      .select().single();

    if (error) {
       console.warn("Could not update session (DB may not be setup). Mocking submit.");
       return res.status(200).json({ message: 'Exam submitted successfully (Mocked)' });
    }

    res.status(200).json({ message: 'Exam submitted successfully', session: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
