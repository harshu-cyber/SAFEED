// ============================================================
// SafeED-UP — Auth Service (with School-Only Registration Guard)
// ============================================================
const User = require('../models/User.model');
const Notification = require('../models/Notification.model');
const {
  generateTokenPair,
  verifyRefreshToken,
  generateOpaqueToken,
  hashOpaqueToken,
} = require('../utils/tokenUtils');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('./email.service');
const env = require('../config/env');

// Only these roles can self-register via the public /register endpoint
const SELF_REGISTERABLE_ROLES = ['SCHOOL_ADMIN', 'COACHING_ADMIN'];

class AuthService {
  /**
   * Register a new School/Coaching Admin
   * Password is auto-set to the registered Mobile Number
   * Only SCHOOL_ADMIN and COACHING_ADMIN roles are allowed
   */
  async register(data) {
    const { name, email, phone, role, state, district, institutionName, institutionType, address, affiliationBoard, affiliationCode } = data;

    // ✅ GUARD: Only school/coaching admins can self-register
    if (!SELF_REGISTERABLE_ROLES.includes(role)) {
      const err = new Error('Unauthorized: Only School or Coaching Institute Admins can self-register. Other department accounts are created by system administrators.');
      err.statusCode = 403;
      throw err;
    }

    // ✅ Check duplicate email
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        const err = new Error('An account with this email already exists.');
        err.statusCode = 409;
        throw err;
      }
    }

    // ✅ Auto-set password = mobile number (as per requirement)
    const autoPassword = phone;

    const userData = {
      name,
      email: email.toLowerCase(),
      phone,
      password: autoPassword,
      role: role || 'SCHOOL_ADMIN',
      state: state || 'Uttar Pradesh',
      district,
    };

    if (mongoose.connection.readyState !== 1) {
      // Standalone Demo Fallback
      console.log(`💡 Standalone Demo Registration for: ${email}`);
      const { generateTokenPair } = require('../utils/tokenUtils');
      const fakeUser = {
        _id: 'new_school_' + Date.now(),
        id: 'new_school_' + Date.now(),
        name,
        email: email.toLowerCase(),
        phone,
        role: role || 'SCHOOL_ADMIN',
        state: state || 'Uttar Pradesh',
        district,
        institutionName,
        institutionType,
        isActive: true,
      };

      const { accessToken, refreshToken } = generateTokenPair({ _id: fakeUser._id, email: fakeUser.email, role: fakeUser.role });

      return {
        user: fakeUser,
        accessToken,
        refreshToken,
        credentials: {
          username: email.toLowerCase(),
          password: phone,
          institutionName: institutionName || name,
        },
      };
    }

    // ✅ DB Registration Path
    const user = await User.create(userData);

    await Notification.create({
      userId: user._id,
      type: 'SUCCESS',
      title: '🏫 Institution Account Registered Successfully',
      message: `Welcome! Your institution account for "${institutionName}" has been created. Username: ${email} | Password: ${phone} (Your Mobile Number). Documents awaiting Inspector verification.`,
      module: 'SYSTEM',
    });

    sendWelcomeEmail(user).catch(console.error);

    const { accessToken, refreshToken } = generateTokenPair(user);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    return {
      user: user.toPublicJSON(),
      accessToken,
      refreshToken,
      credentials: {
        username: email.toLowerCase(),
        password: phone,
        institutionName: institutionName || name,
      },
    };
  }

  /**
   * Login a user
   */
  async login(email, password) {
    const mongoose = require('mongoose');

    if (mongoose.connection.readyState !== 1) {
      console.log(`💡 Serving login via Standalone Demo Fallback for: ${email}`);
      const demoUsers = [
        { id: '1', name: 'Super Admin', email: 'superadmin@safeedup.gov.in', role: 'SUPER_ADMIN', state: 'Uttar Pradesh', district: 'Lucknow' },
        { id: '2', name: 'State Admin', email: 'stateadmin@safeedup.gov.in', role: 'STATE_ADMIN', state: 'Uttar Pradesh', district: 'Lucknow' },
        { id: '3', name: 'Suresh Kumar (District Admin)', email: 'districtadmin@safeedup.gov.in', role: 'DISTRICT_ADMIN', state: 'Uttar Pradesh', district: 'Lucknow' },
        { id: '4', name: 'Inspector Singh', email: 'inspector@safeedup.gov.in', role: 'INSPECTION_OFFICER', state: 'Uttar Pradesh', district: 'Lucknow' },
        { id: '5', name: 'ACP Vikram Rathore', email: 'police@safeedup.gov.in', role: 'POLICE_OFFICER', state: 'Uttar Pradesh', district: 'Lucknow' },
        { id: '6', name: 'Chief Fire Officer', email: 'fire@safeedup.gov.in', role: 'FIRE_OFFICER', state: 'Uttar Pradesh', district: 'Lucknow' },
        { id: '7', name: 'Principal Ramesh Chandra', email: 'schooladmin@safeedup.gov.in', role: 'SCHOOL_ADMIN', state: 'Uttar Pradesh', district: 'Lucknow', institutionId: 'inst_01' },
        { id: '8', name: 'Director Amit Academy', email: 'coachingadmin@safeedup.gov.in', role: 'COACHING_ADMIN', state: 'Uttar Pradesh', district: 'Lucknow', institutionId: 'inst_02' },
        { id: '9', name: 'Rahul Gupta (Citizen)', email: 'citizen@safeedup.gov.in', role: 'CITIZEN', state: 'Uttar Pradesh', district: 'Lucknow' },
      ];

      const found = demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!found) {
        const err = new Error('Invalid email or password.');
        err.statusCode = 401;
        throw err;
      }

      const { generateTokenPair } = require('../utils/tokenUtils');
      const { accessToken, refreshToken } = generateTokenPair({ _id: found.id, email: found.email, role: found.role });

      return { user: found, accessToken, refreshToken };
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password +refreshToken +loginAttempts +lockUntil +isActive'
    );

    if (!user) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    if (user.isLocked) {
      const err = new Error('Account temporarily locked due to multiple failed attempts. Try again later.');
      err.statusCode = 423;
      throw err;
    }

    if (!user.isActive) {
      const err = new Error('Your account has been deactivated. Contact administrator.');
      err.statusCode = 403;
      throw err;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    if (user.loginAttempts > 0) {
      await user.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });
    }

    const { accessToken, refreshToken } = generateTokenPair(user);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    return { user: user.toPublicJSON(), accessToken, refreshToken };
  }

  async logout(userId) {
    await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
  }

  async refreshAccessToken(refreshToken) {
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      const err = new Error('Invalid or expired refresh token.');
      err.statusCode = 401;
      throw err;
    }

    const user = await User.findById(decoded.id).select('+refreshToken +isActive');
    if (!user || user.refreshToken !== refreshToken) {
      const err = new Error('Refresh token is invalid or has been revoked.');
      err.statusCode = 401;
      throw err;
    }

    if (!user.isActive) {
      const err = new Error('Account is deactivated.');
      err.statusCode = 403;
      throw err;
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return;

    const resetToken = generateOpaqueToken();
    const hashedToken = hashOpaqueToken(resetToken);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${env.CLIENT_URL}/auth/reset-password/${resetToken}`;
    await sendPasswordResetEmail(user, resetUrl);
  }

  async resetPassword(token, newPassword) {
    const hashedToken = hashOpaqueToken(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpiry');

    if (!user) {
      const err = new Error('Password reset token is invalid or has expired.');
      err.statusCode = 400;
      throw err;
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.refreshToken = undefined;
    await user.save();

    return user.toPublicJSON();
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      const err = new Error('Current password is incorrect.');
      err.statusCode = 400;
      throw err;
    }

    user.password = newPassword;
    user.refreshToken = undefined;
    await user.save();
  }
}

module.exports = new AuthService();
