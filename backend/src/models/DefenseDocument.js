const mongoose = require('mongoose');

// Stores chunked + embedded content from uploaded PDFs for RAG.
// Collection name is fixed to match Atlas Vector Search setup.
const defenseDocumentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },

    pdfName: { type: String, required: true },
    sector: { type: String, default: '' },

    page: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  {
    collection: 'defense_documents',
    versionKey: false, // avoid storing __v for new chunks
  }
);

defenseDocumentSchema.index({ pdfName: 1, page: 1 });
defenseDocumentSchema.index({ pdfName: 1, sector: 1, uploadedAt: -1 });
defenseDocumentSchema.index({ sector: 1, uploadedAt: -1 });

module.exports = mongoose.model('DefenseDocument', defenseDocumentSchema);
