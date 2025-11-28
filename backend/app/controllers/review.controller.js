import Review from '../models/Review.js';
import Job from '../models/Job.js';

export const createReview = async (req, res, next) => {
  try {
    const { rating, review_text } = req.body;
    const job_id = req.params.jobId;

    const job = await Job.findById(job_id);

    if (!job) {
      return res.status(404).json({ error: { message: 'Job not found' } });
    }

    // Check if review already exists
    const existingReview = await Review.findByJobId(job_id);
    if (existingReview) {
      return res.status(400).json({ error: { message: 'Review already exists for this job' } });
    }

    const review = await Review.create({
      job_id,
      homeowner_id: req.user.id,
      contractor_id: job.contractor_id,
      rating,
      review_text
    });

    res.status(201).json({ review });
  } catch (error) {
    next(error);
  }
};

export const getContractorReviews = async (req, res, next) => {
  try {
    const reviews = await Review.findByContractor(req.params.contractorId);
    res.json({ reviews });
  } catch (error) {
    next(error);
  }
};

