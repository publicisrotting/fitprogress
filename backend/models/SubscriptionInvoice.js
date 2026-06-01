const mongoose = require('mongoose');

const subscriptionInvoiceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  ccy: {
    type: Number,
    default: 980
  },
  invoiceId: {
    type: String,
    required: true,
    unique: true
  },
  pageUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'created'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SubscriptionInvoice', subscriptionInvoiceSchema);

