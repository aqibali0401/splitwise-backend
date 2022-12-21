const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();
const bodyParser = require('body-parser');
const User = require('./backend/models/users');
const session = require('express-session');
const jwt = require('jsonwebtoken');
// const { findOne } = require('./models/user');
const bcrypt = require('bcrypt');
var cors = require('cors')


console.log("env->", process.env.JWT_SECRET);

// const nodemailer = require('nodemailer');

// const JWT_SECRET = 'some super secret';

// delete karna he ise 
app.set('view engine', 'ejs');

app.use(cors())
app.use(session({
    secret: "keybord cat",
    resave: false,
    saveUninitialized: true
}));

const dbUrl = process.env.dbUrl || 'mongodb://localhost:27017/splitwiseTest2';

mongoose.connect(dbUrl)
    .then(() => console.log('DB Connected'))
    .catch((err) => console.log(err));


const PORT = process.env.PORT || 5000;
// console.log(process.env);
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true })); 

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    res.send('Home page!!');
});



require('./backend/startup/routes')(app);






















app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
})