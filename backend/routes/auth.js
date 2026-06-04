const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { generateCode, sendVerificationCode } = require('../utils/mailer');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

const signToken = (userId) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google Login
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const { email, name, picture, sub: googleId } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (user) {
      // Update existing user with Google info if missing
      if (!user.googleId) {
        user.googleId = googleId;
        user.picture = picture || user.picture;
        user.name = name || user.name;
      }
      user.emailVerified = true; // Google already verified the email
      await user.save();
    } else {
      // Create new user — Google email is already verified
      user = new User({
        email,
        name,
        picture,
        googleId,
        password: '', // No password for Google users
        emailVerified: true
      });
      await user.save();
    }

    // Create token
    const jwtToken = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token: jwtToken, userId: user._id, user: { name: user.name, email: user.email, picture: user.picture } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Помилка авторизації Google' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Користувач з таким email вже існує' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user — unverified until email code is confirmed
    const code = generateCode();
    user = new User({
      email,
      password: hashedPassword,
      name: name || '',
      emailVerified: false,
      verifyCode: code,
      verifyCodeExpires: Date.now() + 10 * 60 * 1000
    });

    await user.save();

    const sent = await sendVerificationCode(user.email, code);
    res.status(201).json({
      requiresVerification: true,
      email: user.email,
      // dev fallback when SMTP is not configured so the flow still works
      devCode: sent.delivered ? undefined : sent.devCode
    });
  } catch (error) {
    console.error('REGISTER ERROR:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Невірний email або пароль' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Невірний email або пароль' });
    }

    // Require a verified email — issue a fresh code and ask to confirm
    if (!user.emailVerified) {
      const code = generateCode();
      user.verifyCode = code;
      user.verifyCodeExpires = Date.now() + 10 * 60 * 1000;
      user.verifyAttempts = 0;
      await user.save();
      const sent = await sendVerificationCode(user.email, code);
      return res.json({
        requiresVerification: true,
        email: user.email,
        devCode: sent.delivered ? undefined : sent.devCode
      });
    }

    res.json({ token: signToken(user._id), userId: user._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// Verify email with 6-digit code
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) return res.status(400).json({ message: 'Email і код обовʼязкові' });

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });
    if (user.emailVerified) return res.json({ token: signToken(user._id), userId: user._id });

    if (!user.verifyCode || !user.verifyCodeExpires || user.verifyCodeExpires < Date.now()) {
      return res.status(400).json({ message: 'Код прострочений. Надішліть новий.' });
    }
    // Brute-force guard — max 5 attempts per code
    if ((user.verifyAttempts || 0) >= 5) {
      user.verifyCode = undefined;
      user.verifyCodeExpires = undefined;
      user.verifyAttempts = 0;
      await user.save();
      return res.status(429).json({ message: 'Забагато спроб. Надішліть новий код.' });
    }
    if (String(code).trim() !== user.verifyCode) {
      user.verifyAttempts = (user.verifyAttempts || 0) + 1;
      await user.save();
      const left = Math.max(0, 5 - user.verifyAttempts);
      return res.status(400).json({ message: `Невірний код. Залишилось спроб: ${left}` });
    }

    user.emailVerified = true;
    user.verifyCode = undefined;
    user.verifyCodeExpires = undefined;
    user.verifyAttempts = 0;
    await user.save();

    res.json({ token: signToken(user._id), userId: user._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// Resend verification code
router.post('/resend-code', async (req, res) => {
  try {
    const { email } = req.body || {};
    const user = await User.findOne({ email: String(email || '').trim().toLowerCase() });
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });
    if (user.emailVerified) return res.status(400).json({ message: 'Email вже підтверджено' });

    const code = generateCode();
    user.verifyCode = code;
    user.verifyCodeExpires = Date.now() + 10 * 60 * 1000;
      user.verifyAttempts = 0;
    await user.save();
    const sent = await sendVerificationCode(user.email, code);
    res.json({ ok: true, devCode: sent.delivered ? undefined : sent.devCode });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// Forgot Password (Simulated)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Користувача з таким email не знайдено' });
    }

    // Generate simulated token
    const resetToken = Math.random().toString(36).substring(2, 15);
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // In a real app, send email here. Token is NOT returned for security.
    res.json({ message: 'Посилання для відновлення надіслано (симуляція)' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Невірний або прострочений токен' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: 'Пароль успішно змінено' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});



module.exports = router;
