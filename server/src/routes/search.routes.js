// ============================================================
// SafeED-UP — Global Search Route
// Search institutions, Safe IDs, inspections, users, documents
// ============================================================
const router = require('express').Router();
const Institution = require('../models/Institution.model');
const Inspection = require('../models/Inspection.model');
const User = require('../models/User.model');
const Document = require('../models/Document.model');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return sendSuccess(res, { statusCode: 200, message: 'Query too short.', data: { results: [] } });
  }

  const regex = new RegExp(q.trim(), 'i');

  const [institutions, inspections, users, documents] = await Promise.all([
    Institution.find({
      $or: [
        { name: regex },
        { safeId: regex },
        { udiseCode: regex },
        { registrationNumber: regex },
        { 'address.district': regex },
      ],
    }).select('name safeId type address.district riskLevel status').limit(5).lean(),

    Inspection.find({
      $or: [
        { inspectionId: regex },
        { findings: regex },
      ],
    }).select('inspectionId inspectionType status scheduledDate').limit(5).lean(),

    User.find({
      $or: [
        { name: regex },
        { email: regex },
        { phone: regex },
      ],
    }).select('name email role district designation').limit(5).lean(),

    Document.find({
      $or: [
        { title: regex },
        { documentNumber: regex },
      ],
    }).select('title documentType verificationStatus institutionId').limit(5).lean(),
  ]);

  const results = [
    ...institutions.map(i => ({ type: 'INSTITUTION', id: i._id, title: i.name, subtitle: `${i.safeId || 'Unverified'} — ${i.address?.district || ''}`, link: `/dashboard/district-admin/institutions/${i._id}` })),
    ...inspections.map(i => ({ type: 'INSPECTION', id: i._id, title: i.inspectionId, subtitle: `${i.inspectionType} — ${i.status}`, link: `/dashboard/inspector/inspections/${i._id}` })),
    ...users.map(u => ({ type: 'USER', id: u._id, title: u.name, subtitle: `${u.role.replace(/_/g, ' ')} (${u.email})`, link: `/dashboard/super-admin/users` })),
    ...documents.map(d => ({ type: 'DOCUMENT', id: d._id, title: d.title, subtitle: `${d.documentType} — ${d.verificationStatus}`, link: `/dashboard/institution/documents` })),
  ];

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Global search completed.',
    data: { results },
  });
}));

module.exports = router;
