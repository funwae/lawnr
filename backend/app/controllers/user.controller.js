import User from '../models/User.js';

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' }
      });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const { full_name, phone_number } = req.body;
    const updates = {};

    if (full_name !== undefined) updates.full_name = full_name;
    if (phone_number !== undefined) updates.phone_number = phone_number;

    const user = await User.update(req.user.id, updates);

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

