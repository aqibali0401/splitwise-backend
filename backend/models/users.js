const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    userName: { type: String },
    email: { type: String, required: true, unique: [true, "Please enter a unique email!"], trim: true, lowercase: true },
    password: { type: String, required: true },
    date: {
        type: Date,
        default: Date.now()
    },
    friends:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    groups: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group'
        }
    ]
});


const User = mongoose.model('User', userSchema);
module.exports = User;