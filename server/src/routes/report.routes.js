// ============================================================
// SafeED-UP — Report Engine Routes
// Generate PDF & Excel reports
// ============================================================
const router = require('express').Router();
const Institution = require('../models/Institution.model');
const Inspection = require('../models/Inspection.model');
const Document = require('../models/Document.model');
const Deficiency = require('../models/Deficiency.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/authenticate');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

router.use(authenticate);

// Generate PDF Report for Institution
router.get('/institution/:id/pdf', asyncHandler(async (req, res) => {
  const institution = await Institution.findById(req.params.id);
  if (!institution) {
    return sendError(res, { statusCode: 404, message: 'Institution not found.' });
  }

  const doc = new PDFDocument({ margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=SafeED_Report_${institution.safeId || 'INST'}.pdf`);

  doc.pipe(res);

  // Header
  doc.fillColor('#1E3A5F').fontSize(22).text('SafeED-UP Digital Platform', { align: 'center' });
  doc.fontSize(12).fillColor('#5A6A7E').text('Government Grade Safety & Compliance Audit Report', { align: 'center' });
  doc.moveDown(1.5);

  // Institution Box
  doc.fillColor('#1E3A5F').fontSize(16).text(`Institution: ${institution.name}`);
  doc.fontSize(10).fillColor('#1A2332');
  doc.text(`Safe ID: ${institution.safeId || 'PENDING'}`);
  doc.text(`Type: ${institution.type}`);
  doc.text(`Board: ${institution.affiliationBoard || 'N/A'}`);
  doc.text(`District/State: ${institution.address?.district || ''}, ${institution.address?.state || ''}`);
  doc.text(`Status: ${institution.status} | Verification: ${institution.verificationStatus}`);
  doc.text(`Compliance Score: ${institution.complianceScore}% | Risk Level: ${institution.riskLevel}`);
  doc.moveDown(2);

  // Footer
  doc.fontSize(9).fillColor('#8A97A8').text(`Generated on ${new Date().toLocaleString('en-IN')} by ${req.user.name} (${req.user.role})`, { align: 'center' });

  doc.end();
}));

// Export District Institutions to Excel
router.get('/district/excel', asyncHandler(async (req, res) => {
  const { district } = req.query;
  const query = {};
  if (district) query['address.district'] = district;

  const institutions = await Institution.find(query).lean();

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Institutions');

  worksheet.columns = [
    { header: 'Safe ID', key: 'safeId', width: 20 },
    { header: 'Institution Name', key: 'name', width: 30 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'District', key: 'district', width: 20 },
    { header: 'State', key: 'state', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Risk Level', key: 'risk', width: 15 },
    { header: 'Compliance %', key: 'score', width: 15 },
  ];

  institutions.forEach(inst => {
    worksheet.addRow({
      safeId: inst.safeId || 'N/A',
      name: inst.name,
      type: inst.type,
      district: inst.address?.district || '',
      state: inst.address?.state || '',
      status: inst.status,
      risk: inst.riskLevel,
      score: inst.complianceScore || 0,
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=District_Institutions_Report.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
}));

module.exports = router;
