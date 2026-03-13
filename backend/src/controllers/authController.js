import User from '../models/User.js';
import UserAddress from '../models/UserAddress.js';
import { hashPassword, comparePassword, generateToken, validatePassword, validateEmail } from '../utils/password.js';
import { userRegistrationSchema, userLoginSchema } from '../middleware/validation.js';

export const register = async (req, res) => {
  try {
    // Validate input
    const { error } = userRegistrationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    const { name, email, password, phone, role, firebase_uid } = req.body;

    // Validate role if provided
    const validRoles = ['USER', 'ADMIN', 'RIDER'];
    const userRole = (role && validRoles.includes(role)) ? role : 'USER';

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // LINKING: If user exists in but has no firebase_uid, update it!
      if (!existingUser.firebase_uid && firebase_uid) {
        existingUser.firebase_uid = firebase_uid;
        await existingUser.save();

        return res.status(200).json({
          success: true,
          message: 'Account linked successfully',
          user: {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role || 'USER',
            phone: existingUser.phone
          },
          token: generateToken({
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role || 'USER'
          })
        });
      }

      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.message
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = new User({
      name,
      email,
      password_hash: hashedPassword,
      phone,
      role: userRole,
      firebase_uid: firebase_uid || null
    });
    await newUser.save();

    // Generate token
    const token = generateToken({
      id: newUser._id,
      name,
      email,
      role: userRole
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        name,
        email,
        phone,
        role: userRole
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const login = async (req, res) => {
  try {
    // Validate input
    const { error } = userLoginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    const { email, password, firebase_uid, name, role } = req.body;

    let user;

    // 1. Try to find by Firebase UID first
    if (firebase_uid) {
      user = await User.findOne({ firebase_uid });
    }

    // 2. If not found by UID, try by Email
    if (!user) {
      user = await User.findOne({ email });

      if (user) {
        // LINKING: If we found by email but didn't have UID, update it now!
        if (firebase_uid && !user.firebase_uid) {
          user.firebase_uid = firebase_uid;
          await user.save();
        }
      } else if (firebase_uid) {
        // 3. User not found by UID OR Email -> AUTO-SYNC (Create new user from Firebase)
        const dummyHash = '$2b$10$dummyhashforfirebaseuser';
        const validRoles = ['USER', 'ADMIN', 'RIDER'];
        const autoSyncRole = (role && validRoles.includes(role)) ? role : 'USER';

        user = new User({
          name: name || 'Firebase User',
          email,
          password_hash: dummyHash,
          role: autoSyncRole,
          firebase_uid,
          status: 'ACTIVE'
        });
        await user.save();
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if suspended
    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact admin.'
      });
    }

    // If we logged in via Firebase UID, we skip password check.
    // Only check password if NO firebase_uid was provided (legacy login)
    if (!firebase_uid) {
      const isPasswordValid = await comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
    }

    // Generate token
    const token = generateToken({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Fetch default address
    const defaultAddress = await UserAddress.findOne({ user_id: userId, is_default: true });

    let riderStats = {};
    if (user.role === 'RIDER') {
      const Order = await import('../models/Order.js').then(m => m.default);
      const deliveryCount = await Order.countDocuments({ rider_id: userId, status: 'DELIVERED' });
      const earningsResult = await Order.aggregate([
        { $match: { rider_id: userId, status: 'DELIVERED' } },
        { $group: { _id: null, total: { $sum: '$delivery_fee' } } }
      ]);
      riderStats = {
        total_deliveries: deliveryCount,
        total_earnings: earningsResult.length > 0 ? earningsResult[0].total : 0
      };
    }

    const profile = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      created_at: user.created_at,
      default_address: defaultAddress ? {
        address_line1: defaultAddress.address_line1,
        address_line2: defaultAddress.address_line2,
        city: defaultAddress.city,
        state: defaultAddress.state,
        zip_code: defaultAddress.zip_code
      } : null,
      is_online: user.is_online,
      ...riderStats
    };

    res.status(200).json({
      success: true,
      user: profile
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};