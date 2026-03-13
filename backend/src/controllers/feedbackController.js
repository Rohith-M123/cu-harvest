import Feedback from '../models/Feedback.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';

export const submitFeedback = async (req, res) => {
  try {
    const { order_id, rating, comment } = req.body;
    const user_id = req.user.id;

    if (!order_id || !rating) {
      return res.status(400).json({ success: false, message: 'Order ID and rating are required' });
    }

    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user_id.toString() !== user_id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to give feedback for this order' });
    }

    if (order.status !== 'DELIVERED') {
      return res.status(400).json({ success: false, message: 'Can only give feedback for delivered orders' });
    }

    if (!order.rider_id) {
       return res.status(400).json({ success: false, message: 'No rider assigned to this order' });
    }

    const newFeedback = new Feedback({
      order_id,
      user_id,
      rider_id: order.rider_id,
      rating,
      comment
    });

    await newFeedback.save();

    res.status(201).json({ success: true, message: 'Feedback submitted successfully', feedback: newFeedback });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Feedback already submitted for this order' });
    }
    console.error('Submit feedback error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getRiderFeedback = async (req, res) => {
  try {
    const { riderId } = req.params;

    const feedbacks = await Feedback.find({ rider_id: riderId })
      .populate('user_id', 'name')
      .sort({ created_at: -1 });

    const stats = await Feedback.aggregate([
      { $match: { rider_id: new mongoose.Types.ObjectId(riderId) } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, totalCount: { $count: {} } } }
    ]);

    res.status(200).json({
      success: true,
      feedbacks: feedbacks.map(f => ({
        id: f._id,
        user_name: f.user_id ? f.user_id.name : 'Anonymous',
        rating: f.rating,
        comment: f.comment,
        date: f.created_at
      })),
      stats: stats.length > 0 ? {
        averageRating: stats[0].averageRating.toFixed(1),
        totalCount: stats[0].totalCount
      } : { averageRating: 0, totalCount: 0 }
    });

  } catch (error) {
    console.error('Get rider feedback error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('user_id', 'name email')
      .populate('rider_id', 'name')
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      feedbacks: feedbacks.map(f => ({
        id: f._id,
        user_name: f.user_id ? f.user_id.name : 'User',
        user_email: f.user_id ? f.user_id.email : null,
        rider_name: f.rider_id ? f.rider_id.name : 'Rider',
        rating: f.rating,
        comment: f.comment,
        date: f.created_at
      }))
    });

  } catch (error) {
    console.error('Get all feedback error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
