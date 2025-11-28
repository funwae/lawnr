import express from 'express';
import { authenticate, authorize } from '../utils/auth.js';
import {
  createExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  getJobExpenses
} from '../controllers/expense.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('contractor', 'admin'));

router.post('/', createExpense);
router.get('/', getExpenses);
router.get('/job/:jobId', getJobExpenses);
router.get('/:id', getExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;

