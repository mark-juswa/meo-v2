import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const FeeItemSchema = new Schema({
  particular: { type: String, required: true },
  amount: { type: Number, required: true }
});

const OccupancyApplicationSchema = new Schema(
  {
    applicant: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    buildingPermit: {
      type: Schema.Types.ObjectId,
      ref: 'BuildingApplication',
      required: true,
    },

    applicationType: { type: String, default: 'Occupancy' },
    referenceNo: { type: String, unique: true },

    status: {
      type: String,
      enum: [
        'Submitted',
        'Pending MEO',
        'Payment Submitted',
        'Pending BFP',
        'Pending Mayor',
        'Approved',
        'Rejected',
        'Permit Issued',
      ],
      default: 'Submitted',
    },

    permitInfo: {
      buildingPermitNo: { type: String, required: true },
      buildingPermitDate: { type: Date, required: true },
      fsecNo: { type: String, required: true },
      fsecDate: { type: Date, required: true },
    },

    ownerDetails: {
      lastName: { type: String },
      givenName: { type: String },
      middleInitial: { type: String },
      address: { type: String },
      zip: { type: Number },
      telNo: { type: Number },
    },

    requirementsSubmitted: {
      type: [String], 
      default: []
    },
    otherDocs: { type: String },

    // Section 4: Project Details
    projectDetails: {
      projectName: { type: String, required: true },
      projectLocation: { type: String, required: true },
      occupancyUse: { type: String, required: true },
      noStoreys: { type: Number, required: true },
      noUnits: { type: Number },
      totalFloorArea: { type: Number },
      dateCompletion: { type: Date, required: true },
    },

    signatures: {
      ownerName: { type: String, required: true },
      ownerCtcNo: { type: Number },
      ownerCtcDate: { type: Date },
      ownerCtcPlace: { type: String },

      inspectorName: { type: String, required: true },

      engineerName: { type: String, required: true },
      engineerPrcNo: { type: Number },
      engineerPrcValidity: { type: Date },
      engineerPtrNo: { type: Number },
      engineerPtrDate: { type: Date },
      engineerIssuedAt: { type: String },
      engineerTin: { type: Number },
      engineerCtcNo: { type: Number },
      engineerCtcDate: { type: Date },
      engineerCtcPlace: { type: String },
    },

    assessmentDetails: {
      assessedBy: { type: String },
      reviewedBy: { type: String },
      notedBy: { type: String },
      date: { type: Date, default: Date.now },
    },

    feesDetails: {
      fees: [FeeItemSchema],
      totalAmountDue: { type: Number, default: 0 },
    },

    rejectionDetails: {
      comments: { type: String, default: '' },
      missingDocuments: [{ type: String }],
      isResolved: { type: Boolean, default: false }
    },

    documents: [{
      requirementName: String,
      fileName: String,
      filePath: String, 
      fileContent: String, 
      mimeType: String, 
      fileSize: Number, 
      uploadedAt: { type: Date, default: Date.now },
      uploadedBy: { type: String, default: 'user' } 
    }],

    workflowHistory: [
      {
        status: { type: String, required: true },
        comments: { type: String },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    paymentDetails: {
      method: { type: String, enum: ['Walk-In', 'Online'], default: null },
      status: { type: String, enum: ['Pending', 'Verified', 'Failed'], default: 'Pending' },
      referenceNumber: { type: String },
      proofOfPaymentFile: { type: String }, 
      paymentProof: {
        fileName: { type: String },
        fileContent: { type: String }, 
        mimeType: { type: String },
        fileSize: { type: Number }
      },
      dateSubmitted: { type: Date },
      amountPaid: { type: Number }
    },
  },
  { timestamps: true }
);


OccupancyApplicationSchema.pre('save', async function (next) {
  if (this.isNew && !this.referenceNo) {
    this.referenceNo = `O-${Date.now()}`;
  }
  next();
});

export default mongoose.model('OccupancyApplication', OccupancyApplicationSchema);
