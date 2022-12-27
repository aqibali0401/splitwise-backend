const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({    
    id: mongoose.Schema.Types.ObjectId,
    groupName: { type: String },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    groupType: {
        type: String,
        enum: ["Trip", "Party", "Home", "Other"]
    },
    createdAt: { type: Date, default: Date.now() },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
})

module.exports = mongoose.model('Group', groupSchema);