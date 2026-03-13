import express from 'express';
import { submitFeedback, getRiderFeedback, getAllFeedback } from '../controllers/feedbackController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All feedback routes require authentication
router.use(authenticate);

// User: Submit feedback
router.post('/', submitFeedback);

// Rider: Get their own feedback/stats
router.get('/rider/:riderId', getRiderFeedback);

// Admin: Get all feedback
router.get('/admin/all', authorizeRoles(['ADMIN']), getAllFeedback);

export default router;
