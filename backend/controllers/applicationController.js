import BuildingApplication from '../models/BuildingApplication.js';
import OccupancyApplication from '../models/OccupancyApplication.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// HELPER FUNCTIONS
// convert values to string safely
const toStr = (val) => {
    if (val === null || val === undefined || val === '') return '';
    return String(val);
};

// convert file to Base64 for file uploads
const fileToBase64 = (file) => {
    return file.buffer.toString('base64');
};

// get MIME type from file
const getMimeType = (file) => {
    return file.mimetype;
};

// save file to database
const saveFileToDatabase = (file) => {
    return {
        fileName: file.originalname,
        fileContent: fileToBase64(file),
        mimeType: getMimeType(file),
        fileSize: file.size
    };
};


// generate filled PDF for building application
const generateFilledPDF = async (applicationData, referenceNo) => {
    try {
        const blankPdfPath = path.join(__dirname, '../../frontend/public/building_permit_form_fillable.pdf');
        
        if (!fs.existsSync(blankPdfPath)) {
            console.error('Blank PDF form not found at:', blankPdfPath);
            return null;
        }

        const formPdfBytes = fs.readFileSync(blankPdfPath);
        const pdfDoc = await PDFDocument.load(formPdfBytes);
        const form = pdfDoc.getForm();

        const { box1, box2, box3, box4 } = applicationData;
        try {
            form.getTextField('owner_lastname').setText(toStr(box1?.owner?.lastName));
            form.getTextField('owner_firstname').setText(toStr(box1?.owner?.firstName));
            form.getTextField('owner_mi').setText(toStr(box1?.owner?.middleInitial));
            form.getTextField('owner_tin').setText(toStr(box1?.owner?.tin));

            form.getTextField('ent_form').setText(toStr(box1?.enterprise?.formOfOwnership));
            form.getTextField('ent_addr_no').setText(toStr(box1?.enterprise?.address?.no));
            form.getTextField('ent_addr_street').setText(toStr(box1?.enterprise?.address?.street));
            form.getTextField('ent_addr_brgy').setText(toStr(box1?.enterprise?.address?.barangay));
            form.getTextField('ent_addr_city').setText(toStr(box1?.enterprise?.address?.city));
            form.getTextField('ent_addr_zip').setText(toStr(box1?.enterprise?.address?.zip));
            form.getTextField('ent_addr_tel').setText(toStr(box1?.enterprise?.address?.telNo));

            form.getTextField('loc_lot').setText(toStr(box1?.location?.lotNo));
            form.getTextField('loc_blk').setText(toStr(box1?.location?.blkNo));
            form.getTextField('loc_tct').setText(toStr(box1?.location?.tctNo));
            form.getTextField('loc_taxdec').setText(toStr(box1?.location?.taxDecNo));
            form.getTextField('loc_street').setText(toStr(box1?.location?.street));
            form.getTextField('loc_brgy').setText(toStr(box1?.location?.barangay));
            form.getTextField('loc_city').setText(toStr(box1?.location?.city));

            const scopes = box1?.scopeOfWork || [];
            const scopeIds = [
                'new', 'erection', 'addition', 'alteration', 'renovation',
                'conversion', 'repair', 'moving', 'raising', 'accessory', 'others'
            ];
            scopeIds.forEach((id) => {
                try {
                    const cb = form.getCheckBox(`scope_${id}`);
                    scopes.includes(id) ? cb.check() : cb.uncheck();
                } catch (e) {
                    console.log(`Checkbox scope_${id} not found in PDF form`);
                }
            });
            const occ = box1?.occupancy?.group || '';
            const occMap = {
                group_a: 'occ_group_a',
                group_b: 'occ_group_b',
                group_c: 'occ_group_c',
                group_d: 'occ_group_d',
                group_e: 'occ_group_e',
                group_f: 'occ_group_f',
                group_g: 'occ_group_g',
                group_h_load_lt_1000: 'occ_group_h1',
                group_h_load_gt_1000: 'occ_group_h2',
                group_i: 'occ_group_i',
                group_j: 'occ_group_j',
                others: 'occ_group_others'
            };

            Object.values(occMap).forEach((field) => {
                try { form.getCheckBox(field).uncheck(); } catch (e) {}
            });

            if (occMap[occ]) {
                try { form.getCheckBox(occMap[occ]).check(); } catch (e) {}
            }

            // Project details
            form.getTextField('occupancy_classified').setText(toStr(box1?.occupancy?.classified));
            form.getTextField('proj_units').setText(toStr(box1?.projectDetails?.numberOfUnits));
            form.getTextField('proj_tfa').setText(toStr(box1?.projectDetails?.totalFloorArea));
            form.getTextField('proj_lot_area').setText(toStr(box1?.projectDetails?.lotArea));
            form.getTextField('proj_total_cost').setText(toStr(box1?.projectDetails?.totalEstimatedCost));
            form.getTextField('proj_start_date').setText(toStr(box1?.projectDetails?.proposedConstruction));
            form.getTextField('proj_end_date').setText(toStr(box1?.projectDetails?.expectedCompletion));

            // Box 2 - Architect/Engineer
            form.getTextField('box2_name').setText(toStr(box2?.name));
            form.getTextField('box2_date').setText(toStr(box2?.date));
            form.getTextField('box2_address').setText(toStr(box2?.address));
            form.getTextField('box2_prc').setText(toStr(box2?.prcNo));
            form.getTextField('box2_validity').setText(toStr(box2?.validity));
            form.getTextField('box2_ptr').setText(toStr(box2?.ptrNo));
            form.getTextField('box2_ptr_date').setText(toStr(box2?.ptrDate));
            form.getTextField('box2_issued_at').setText(toStr(box2?.issuedAt));
            form.getTextField('box2_tin').setText(toStr(box2?.tin));

            // Box 3 - Applicant
            form.getTextField('box3_name').setText(toStr(box3?.name));
            form.getTextField('box3_date').setText(toStr(box3?.date));
            form.getTextField('box3_address').setText(toStr(box3?.address));
            form.getTextField('box3_ctc').setText(toStr(box3?.ctcNo));
            form.getTextField('box3_ctc_date').setText(toStr(box3?.dateIssued));
            form.getTextField('box3_ctc_place').setText(toStr(box3?.placeIssued));

            // Box 4 - Lot Owner
            form.getTextField('box4_name').setText(toStr(box4?.name));
            form.getTextField('box4_date').setText(toStr(box4?.date));
            form.getTextField('box4_address').setText(toStr(box4?.address));
            form.getTextField('box4_ctc').setText(toStr(box4?.tctNo));
            form.getTextField('box4_ctc_date').setText(toStr(box4?.taxDecNo));
            form.getTextField('box4_ctc_place').setText(toStr(box4?.placeIssued));

        } catch (fieldError) {
            console.log('Some PDF fields might not exist:', fieldError.message);
        }

        form.flatten();

        const pdfBytes = await pdfDoc.save();
        
        const uploadsDir = path.join(__dirname, '../uploads/applications');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Save the filled PDF
        const fileName = `Building_Application_${referenceNo}_${Date.now()}.pdf`;
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, pdfBytes);

        return `/uploads/applications/${fileName}`;

    } catch (error) {
        console.error('Error generating filled PDF:', error);
        return null;
    }
};

// LOGIC FOR SUBMITTING APPLICATIONS
export const submitBuildingApplication = async (req, res) => {
    try {
        const applicantId = req.user.userId;
        const { box1, box2, box3, box4 } = req.body;

        if (!box1 || !box2 || !box3 || !box4) {
            return res.status(400).json({ message: 'Missing required form sections' });
        }

        const newApplication = new BuildingApplication({
            applicant: applicantId,
            status: 'Submitted',
            workflowHistory: [
                {
                    status: 'Submitted',
                    comments: 'Application submitted by user.',
                    updatedBy: applicantId,
                },
            ],
            box1,
            box2,
            box3,
            box4,
        });

        const savedApplication = await newApplication.save();

        const pdfPath = await generateFilledPDF({ box1, box2, box3, box4 }, savedApplication.referenceNo);
        
        if (pdfPath) {
            savedApplication.documents.push({
                requirementName: 'Completed Application Form',
                fileName: `Building_Application_${savedApplication.referenceNo}.pdf`,
                filePath: pdfPath,
                uploadedAt: new Date(),
                uploadedBy: 'system'
            });
            await savedApplication.save();
        }

        res.status(201).json({
            message: 'Building application submitted successfully',
            applicationId: savedApplication._id,
            referenceNo: savedApplication.referenceNo,
            applicationFormPdf: pdfPath
        });
    } catch (error) {
        console.error('Error submitting building application:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


// LOGIC FOR SUBMITTING OCCUPANCY APPLICATION
export const submitOccupancyApplication = async (req, res) => {
    try {
        const applicantId = req.user.userId;
        const {
            buildingPermitIdentifier, 
            permitInfo,
            ownerDetails,
            requirementsSubmitted,
            otherDocs,
            projectDetails,
            signatures,
        } = req.body;

        if (!buildingPermitIdentifier || !permitInfo || !projectDetails || !signatures) {
            return res.status(400).json({ message: 'Missing required form fields' });
        }

        // Find the Building Application
        const query = {
            $or: [
                { referenceNo: buildingPermitIdentifier }
            ]
        };

        if (mongoose.Types.ObjectId.isValid(buildingPermitIdentifier)) {
            query.$or.push({ _id: buildingPermitIdentifier });
        }

        const parentBuildingApp = await BuildingApplication.findOne(query);
        if (!parentBuildingApp) {
            return res.status(404).json({ 
                message: `Building Permit not found with Reference or ID: ${buildingPermitIdentifier}` 
            });
        }

        // Create the Occupancy Application using the found parent ID
        const newApplication = new OccupancyApplication({
            applicant: applicantId,
            buildingPermit: parentBuildingApp._id, // Link using the actual database _id
            status: 'Submitted',
            workflowHistory: [
                {
                    status: 'Submitted',
                    comments: 'Application submitted by user.',
                    updatedBy: applicantId,
                },
            ],
            permitInfo,
            ownerDetails,
            requirementsSubmitted,
            otherDocs,
            projectDetails,
            signatures,
        });

        const savedApplication = await newApplication.save();

        res.status(201).json({
            message: 'Occupancy application submitted successfully',
            applicationId: savedApplication._id,
            referenceNo: savedApplication.referenceNo, 
        });
    } catch (error) {
        console.error('Error submitting occupancy application:', error);
        console.error('Error details:', error.message);
        if (error.name === 'ValidationError') {
            console.error('Validation errors:', error.errors);
            return res.status(400).json({ 
                message: 'Validation error', 
                details: Object.keys(error.errors).map(key => ({
                    field: key,
                    message: error.errors[key].message
                }))
            });
        }
        res.status(500).json({ message: 'Server error', details: error.message });
    }
};


// LOGIC FOR GETTING USER'S APPLICATIONS
export const getMyApplications = async (req, res) => {
    try {
        const applicantId = req.user.userId;

        const buildingApps = await BuildingApplication.find({ applicant: applicantId })
            .sort({ createdAt: -1 })
            .select('applicationType referenceNo createdAt status'); 

        const occupancyApps = await OccupancyApplication.find({ applicant: applicantId })
            .sort({ createdAt: -1 })
            .select('applicationType referenceNo createdAt status');

        const applications = [...buildingApps, ...occupancyApps].sort(
            (a, b) => b.createdAt - a.createdAt
        );

        res.status(200).json({ applications });
    } catch (error) {
        console.error('Error fetching user applications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


// LOGIC FOR GETTING APPLICATION BY REFERENCE NUMBER
export const getApplicationByReferenceNo = async (req, res) => {
    try {
        const { referenceNo } = req.params;

        const query = { referenceNo: { $regex: new RegExp(`^${referenceNo}$`, 'i') } };

        
        let application = await BuildingApplication.findOne(query)
            .select('applicationType referenceNo createdAt status workflowHistory box1 box2 box3 box4 box5 box6 rejectionDetails documents permit'); 

        if (!application) {
            
            application = await OccupancyApplication.findOne(query)
                .select('applicationType referenceNo createdAt status workflowHistory permitInfo ownerDetails projectDetails signatures assessmentDetails feesDetails rejectionDetails documents');
        }

        if (!application) {
            return res.status(404).json({ message: 'Application not found. Please check your tracking number.' });
        }

        res.status(200).json({ application });
    } catch (error) {
        console.error('Error fetching application by reference number:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


// LOGIC FOR GETTING ALL APPLICATIONS (ADMIN ONLY)
export const getAllApplications = async (req, res) => {
    try {
        const buildingApps = await BuildingApplication.find()
            .populate('applicant', 'first_name last_name')
            .sort({ createdAt: -1 });

        const occupancyApps = await OccupancyApplication.find()
            .populate('applicant', 'first_name last_name')
            .sort({ createdAt: -1 });

        const applications = [...buildingApps, ...occupancyApps].sort(
            (a, b) => b.createdAt - a.createdAt
        );

        res.status(200).json({ applications });
    } catch (error) {
        console.error('Error fetching all applications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


// HELPER: Generate final MEO-style permit number for issued permits
async function generateFinalPermitNumber(applicationType) {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const yearMonth = year + month;

    // Search across both application types to get the highest sequence number
    const regex = new RegExp(`^${yearMonth}\\d{6}$`);
    
    const buildingPermits = await BuildingApplication
        .find({ 'permit.permitNumber': regex })
        .sort({ 'permit.permitNumber': -1 })
        .limit(1)
        .select('permit.permitNumber')
        .lean();

    const occupancyPermits = await OccupancyApplication
        .find({ 'permit.permitNumber': regex })
        .sort({ 'permit.permitNumber': -1 })
        .limit(1)
        .select('permit.permitNumber')
        .lean();

    let sequence = 1;
    const allPermits = [...buildingPermits, ...occupancyPermits]
        .map(p => p.permit?.permitNumber)
        .filter(Boolean);

    if (allPermits.length > 0) {
        const sequences = allPermits.map(pn => parseInt(pn.slice(-6), 10));
        sequence = Math.max(...sequences) + 1;
    }

    // Format: YYMM######
    const sequenceStr = String(sequence).padStart(6, '0');
    return `${yearMonth}${sequenceStr}`;
}

// LOGIC FOR UPDATING APPLICATION STATUS (ADMIN ONLY)
export const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const { status, comments, missingDocuments, box5, box6 } = req.body;
        const adminUserId = req.user.userId;

  
        let application = await BuildingApplication.findById(id);
        if (!application) {
            application = await OccupancyApplication.findById(id);
        }
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        if (status) {
            application.status = status;
        }

        if (status === 'For Correction' || status === 'Rejected') {
            application.rejectionDetails = {
                comments: comments || 'No comments provided.',
                missingDocuments: missingDocuments || [],
                isResolved: false, // Mark as unresolved
            };
        }
 
        // Clear rejection details when moving to these statuses
        if (status === 'Submitted' || status === 'Pending MEO' || status === 'Payment Pending') {
             application.rejectionDetails = {
                comments: '',
                missingDocuments: [],
                isResolved: true,
            };
        }
        
        // If rejectionDetails is explicitly provided in the request body, use it
        if (req.body.rejectionDetails) {
            application.rejectionDetails = req.body.rejectionDetails;
        }

        
        // Update Box 5 or Box 6 if provided (for MEO assessment)
        if (box5) application.box5 = box5;
        if (box6) application.box6 = box6;

        // Generate final permit number when permit is issued
        if (status === 'Permit Issued' && !application.permit?.permitNumber) {
            const permitNumber = await generateFinalPermitNumber(application.applicationType);
            application.permit = {
                permitNumber: permitNumber,
                issuedAt: new Date(),
                issuedBy: adminUserId
            };
        }

        // Add to workflow history
        if (status) {
             application.workflowHistory.push({
                status: status,
       
                comments: comments || `Status updated to ${status} by admin.`,
                updatedBy: adminUserId,
                timestamp: new Date(),
            });
        }

        const updatedApplication = await application.save();
        

        const populatedApp = await updatedApplication.populate('applicant', 'first_name last_name');

        res.status(200).json({ 
            message: 'Application updated successfully',
            application: populatedApp
        });

    } catch (error) {
        console.error('Error updating application status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


export const submitPaymentProof = async (req, res) => {
    try {
        const { id } = req.params;
        const { method, referenceNumber } = req.body;
        
        if (!req.file && method === 'Online') {
            return res.status(400).json({ message: 'Proof of payment image is required for online transactions.' });
        }

        let application = await BuildingApplication.findById(id);
        if (!application) {
            application = await OccupancyApplication.findById(id);
        }

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Save payment proof as Base64 if file exists
        let paymentProofData = null;
        if (req.file) {
            paymentProofData = saveFileToDatabase(req.file);
        }

        application.paymentDetails = {
            method: method, 
            status: 'Pending', 
            dateSubmitted: new Date(),
            proofOfPaymentFile: req.file ? `/uploads/${req.file.filename}` : null, // Keep for backward compatibility
            paymentProof: paymentProofData,
            referenceNumber: referenceNumber || null
        };

        application.status = 'Payment Submitted'; 

        application.workflowHistory.push({
            status: 'Payment Submitted',
            comments: `User submitted ${method} payment proof.`,
            updatedBy: req.user.userId,
            timestamp: new Date()
        });

        await application.save();

        res.status(200).json({ message: 'Payment proof submitted successfully', application });

    } catch (error) {
        console.error('Error submitting payment:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


export const uploadPaymentProof = async (req, res) => {
    try {
        const { appId, applicationType } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image uploaded." });
        }

        const Model = applicationType === "Building" ? BuildingApplication : OccupancyApplication;
        const application = await Model.findById(appId);
        
        if (!application) return res.status(404).json({ success: false, message: "Application not found." });

        // Save payment proof as Base64
        const paymentProofData = saveFileToDatabase(req.file);
        
        application.paymentDetails.proofOfPaymentFile = `/uploads/payments/${req.file.filename}`; 
        application.paymentDetails.paymentProof = paymentProofData;
        application.paymentDetails.status = "Pending"; 
        application.paymentDetails.dateSubmitted = new Date();

        application.status = "Payment Submitted"; 

        await application.save();

        return res.json({
            success: true,
            message: "Payment proof uploaded successfully.",
            proof: application.paymentDetails.proofOfPaymentFile
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server error." });
    }
};


// LOGIC FOR UPLOADING SUPPORTING DOCUMENTS
export const uploadSupportingDocuments = async (req, res) => {
    try {
        const { id } = req.params;
        const { requirementName, applicationId } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'No document uploaded.' });
        }

        if (!requirementName) {
            return res.status(400).json({ message: 'Requirement name is required.' });
        }

        // Find the building application
        const application = await BuildingApplication.findById(id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found.' });
        }

        // Check if user owns this application
        if (application.applicant.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Unauthorized access.' });
        }

        const fileData = saveFileToDatabase(req.file);
        const documentEntry = {
            requirementName,
            fileName: fileData.fileName,
            fileContent: fileData.fileContent,
            mimeType: fileData.mimeType,
            fileSize: fileData.fileSize,
            uploadedAt: new Date(),
            uploadedBy: 'user'
        };

        const existingDocIndex = application.documents.findIndex(
            doc => doc.requirementName === requirementName
        );

        if (existingDocIndex >= 0) {
            application.documents[existingDocIndex] = documentEntry;
        } else {
            application.documents.push(documentEntry);
        }

        // Add to workflow history
        application.workflowHistory.push({
            status: application.status,
            comments: `User uploaded supporting document: ${requirementName}`,
            updatedBy: req.user.userId,
            timestamp: new Date()
        });

        await application.save();

        res.status(200).json({
            message: 'Document uploaded successfully.',
            document: documentEntry
        });

    } catch (error) {
        console.error('Error uploading supporting document:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


// LOGIC FOR DOWNLOADING APPLICATION PDF (ADMIN ONLY)
export const downloadApplicationPDF = async (req, res) => {
    try {
        const { id } = req.params;

        let application = await BuildingApplication.findById(id);
        if (!application) {
            application = await OccupancyApplication.findById(id);
        }

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Find the system-generated application form document
        const applicationFormDoc = application.documents.find(
            doc => doc.requirementName === 'Completed Application Form' && doc.uploadedBy === 'system'
        );

        if (!applicationFormDoc) {
            return res.status(404).json({ message: 'Application form PDF not found' });
        }

        const filePath = path.join(__dirname, '..', applicationFormDoc.filePath);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'PDF file not found on server' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${applicationFormDoc.fileName}"`);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Error downloading application PDF:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// LOGIC FOR SAVING FILES IN DATABASE
export const serveFileFromDatabase = async (req, res) => {
    try {
        const { applicationId, documentIndex } = req.params;
        
        console.log('=== serveFileFromDatabase called ===');
        console.log('Application ID:', applicationId);
        console.log('Document Index:', documentIndex);
        console.log('User ID:', req.user.userId);
        console.log('User Role:', req.user.role);

        // Find the application
        let application = await BuildingApplication.findById(applicationId);
        if (!application) {
            application = await OccupancyApplication.findById(applicationId);
        }

        if (!application) {
            console.error('Application not found for ID:', applicationId);
            return res.status(404).json({ message: 'Application not found' });
        }

        console.log('Application found:', application._id);
        console.log('Total documents:', application.documents.length);

        // Check if user owns this application or is admin
        const isOwner = application.applicant.toString() === req.user.userId;
        const isAdmin = ['meoadmin', 'bfpadmin', 'mayoradmin'].includes(req.user.role);
        
        if (!isOwner && !isAdmin) {
            console.error('Unauthorized access attempt by user:', req.user.userId);
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        // Get the document
        const docIndex = parseInt(documentIndex);
        console.log('Parsed document index:', docIndex);
        
        if (isNaN(docIndex) || docIndex < 0 || docIndex >= application.documents.length) {
            console.error('Invalid document index:', documentIndex, 'Available:', application.documents.length);
            return res.status(404).json({ 
                message: 'Document not found',
                details: `Invalid document index: ${documentIndex}. Available documents: ${application.documents.length}`
            });
        }
        
        const document = application.documents[docIndex];
        if (!document) {
            console.error('Document is null at index:', docIndex);
            return res.status(404).json({ message: 'Document not found' });
        }

        console.log('Document found:', document.fileName);
        console.log('Has fileContent:', !!document.fileContent);
        console.log('Has filePath:', !!document.filePath);

        if (document.fileContent && document.mimeType) {
            console.log('Serving from base64 content');
            const buffer = Buffer.from(document.fileContent, 'base64');
            
            res.setHeader('Content-Type', document.mimeType);
            res.setHeader('Content-Length', buffer.length);
            res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
            
            return res.send(buffer);
        }

        if (document.filePath) {
            const filePath = path.join(__dirname, '..', document.filePath);
            console.log('Attempting to serve from file path:', filePath);
            if (fs.existsSync(filePath)) {
                console.log('File exists, sending...');
                return res.sendFile(filePath);
            } else {
                console.error('File does not exist at path:', filePath);
            }
        }

        console.error('No file content or path available');
        return res.status(404).json({ message: 'File content not found' });

    } catch (error) {
        console.error('Error serving file from database:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// LOGIC FOR SAVING PAYMENT PROOF IN DATABASE
export const servePaymentProofFromDatabase = async (req, res) => {
    try {
        const { applicationId } = req.params;

        // Find the application
        let application = await BuildingApplication.findById(applicationId);
        if (!application) {
            application = await OccupancyApplication.findById(applicationId);
        }

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Check if user owns this application or is admin
        const isOwner = application.applicant.toString() === req.user.userId;
        const isAdmin = ['meoadmin', 'bfpadmin', 'mayoradmin'].includes(req.user.role);
        
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const paymentProof = application.paymentDetails?.paymentProof;
        if (!paymentProof || !paymentProof.fileContent) {
            // Fallback to old file path method for backward compatibility
            if (application.paymentDetails?.proofOfPaymentFile) {
                const filePath = path.join(__dirname, '..', application.paymentDetails.proofOfPaymentFile);
                if (fs.existsSync(filePath)) {
                    return res.sendFile(filePath);
                }
            }
            return res.status(404).json({ message: 'Payment proof not found' });
        }

        const buffer = Buffer.from(paymentProof.fileContent, 'base64');
        
        res.setHeader('Content-Type', paymentProof.mimeType);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Content-Disposition', `inline; filename="${paymentProof.fileName}"`);
        
        return res.send(buffer);

    } catch (error) {
        console.error('Error serving payment proof from database:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
