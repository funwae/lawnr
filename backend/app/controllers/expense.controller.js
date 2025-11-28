import Expense from '../models/Expense.js';

export const createExpense = async (req, res, next) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      contractor_id: req.user.id
    });

    res.status(201).json({ expense });
  } catch (error) {
    next(error);
  }
};

export const getExpenses = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.start_date,
      endDate: req.query.end_date,
      expenseType: req.query.expense_type,
      jobId: req.query.job_id,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const expenses = await Expense.findByContractor(req.user.id, filters);
    res.json({ expenses });
  } catch (error) {
    next(error);
  }
};

export const getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ error: { message: 'Expense not found' } });
    }

    if (expense.contractor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    res.json({ expense });
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ error: { message: 'Expense not found' } });
    }

    if (expense.contractor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    const updated = await Expense.update(req.params.id, req.body);
    res.json({ expense: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ error: { message: 'Expense not found' } });
    }

    if (expense.contractor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    await Expense.delete(req.params.id);
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    next(error);
  }
};

export const getJobExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.findByJob(req.params.jobId);
    res.json({ expenses });
  } catch (error) {
    next(error);
  }
};

