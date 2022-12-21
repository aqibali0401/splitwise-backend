const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({

    expenseName: { type: String },
    discription: { type: String },
    amount: { type: Number },
    splitOption: {
        type: String,
        enum: ["equally", "unequally"]
    },
    createdAt: { type: Date, default: Date.now },
    paidBy: [
        // "_id": { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        // "userName":{ type: string }
        {
            user: {
                id: {
                    type: mongoose.Schema.Types.ObjectId, ref: 'User'
                },
                paidAmount: { type: Number }
            },

        }
    ],

    splitBeetween: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        
    }]

})