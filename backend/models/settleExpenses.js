const mongoose = require('mongoose');

const settleExpense = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    paidTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    amount: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('SettleExpense', settleExpense);