import express from 'express';
import { authenticate } from '../utils/auth.js';
import { getJobs, getJob, updateJobStatus, createJob, cancelJobEndpoint } from '../controllers/job.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getJobs);
router.get('/:id', getJob);
router.post('/', createJob);
router.post('/:id/on_way', updateJobStatus);
router.post('/:id/start', updateJobStatus);
router.post('/:id/complete', updateJobStatus);
router.post('/:id/cancel', cancelJobEndpoint);

export default router;

