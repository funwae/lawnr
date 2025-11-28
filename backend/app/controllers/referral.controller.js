import Referral from '../models/Referral.js';
import User from '../models/User.js';
import { sendWelcomeEmail } from '../services/email.service.js';

export const getMyReferralCode = async (req, res, next) => {
  try {
    // Check if user already has a referral code
    const existing = await Referral.findByReferrer(req.user.id);

    let referralCode;
    if (existing.length > 0) {
      referralCode = existing[0].referral_code;
    } else {
      // Generate new referral code
      referralCode = Referral.generateCode(req.user.id);
      await Referral.create({
        referrer_id: req.user.id,
        referral_code: referralCode
      });
    }

    res.json({ referral_code: referralCode });
  } catch (error) {
    next(error);
  }
};

export const getMyReferrals = async (req, res, next) => {
  try {
    const referrals = await Referral.findByReferrer(req.user.id);
    res.json({ referrals });
  } catch (error) {
    next(error);
  }
};

export const applyReferralCode = async (req, res, next) => {
  try {
    const { referral_code } = req.body;

    const referral = await Referral.findByCode(referral_code);

    if (!referral) {
      return res.status(404).json({ error: { message: 'Invalid referral code' } });
    }

    if (referral.referrer_id === req.user.id) {
      return res.status(400).json({ error: { message: 'Cannot use your own referral code' } });
    }

    if (referral.status !== 'pending') {
      return res.status(400).json({ error: { message: 'Referral code already used' } });
    }

    // Complete the referral
    await Referral.complete(referral_code, req.user.id);

    // Reward referrer (e.g., $10 credit)
    await Referral.reward(referral.id, 'credit', 10.00);

    // Send welcome email with referral code for new user
    const user = await User.findById(req.user.id);
    if (user.email) {
      const newUserCode = Referral.generateCode(req.user.id);
      await Referral.create({
        referrer_id: req.user.id,
        referral_code: newUserCode
      });

      await sendWelcomeEmail(user.email, user.full_name, user.role, newUserCode);
    }

    res.json({
      success: true,
      message: 'Referral code applied successfully. You and your referrer have been rewarded!'
    });
  } catch (error) {
    next(error);
  }
};

