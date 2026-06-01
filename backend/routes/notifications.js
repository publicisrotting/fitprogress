const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

// Get all notifications for the user
router.get('/', auth, async (req, res) => {
  try {
    let notifications = await Notification.find({ user: req.user.userId })
      .sort({ createdAt: -1 });

    // If no notifications exist, create a welcome one
    if (notifications.length === 0) {
      const welcomeNotification = new Notification({
        user: req.user.userId,
        title: 'Ласкаво просимо!',
        text: 'Вітаємо у FitProgress! Тут ви будете отримувати важливі сповіщення про ваші досягнення.',
        type: 'info',
        read: false
      });
      await welcomeNotification.save();
      notifications = [welcomeNotification];
    }

    res.json(notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create a notification
router.post('/', auth, async (req, res) => {
  try {
    const { title, text, type } = req.body;
    const newNotification = new Notification({
      user: req.user.userId,
      title,
      text,
      type
    });
    const notification = await newNotification.save();
    res.json(notification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Mark all as read
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.userId, read: false },
      { $set: { read: true } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Mark single as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    let notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ msg: 'Notification not found' });

    if (!notification.user || notification.user.toString() !== req.user.userId) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ msg: 'Notification not found' });

    if (!notification.user || notification.user.toString() !== req.user.userId) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await notification.deleteOne();
    res.json({ msg: 'Notification removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
