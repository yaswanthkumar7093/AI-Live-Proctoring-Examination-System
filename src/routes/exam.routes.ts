import { Router } from 'express';
import { getExams, getExamById, startExamSession, submitExamSession } from '../controllers/exam.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth); // Protect all exam routes

router.get('/', getExams);
router.get('/:id', getExamById);
router.post('/:id/start', startExamSession);
router.post('/:id/submit', submitExamSession);

export default router;
