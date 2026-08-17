// ============================================================
// SafeED-UP — Notification Routes & Controller
// ============================================================
const Notification = require('../models/Notification.model');
const { sendSuccess, buildPaginationMeta } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const router = require('express').Router();
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const query = { userId: req.user._id };
  if (unreadOnly === 'true') query.isRead = false;

  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ userId: req.user._id, isRead: false }),
  ]);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Notifications fetched.',
    data: { notifications, unreadCount },
    meta: buildPaginationMeta(total, page, limit),
  });
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isRead: true, readAt: new Date() }
  );
  return sendSuccess(res, { statusCode: 200, message: 'Notification marked as read.' });
}));

router.patch('/read-all', asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return sendSuccess(res, { statusCode: 200, message: 'All notifications marked as read.' });
}));

module.exports = router;
