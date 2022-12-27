const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    userName: { type: String },
    email: { type: String, required: true, unique: [true, "Please enter a unique email!"], trim: true, lowercase: true },
    password: { type: String, required: true },
    date: {
        type: Date,
        default: Date.now()
    }
});


module.exports = mongoose.model('User', userSchema);
