const User = require('../models/users');
const asyncMiddleware = require('../middleware/async');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');


// Route 1: Creating a user using POST "/api/v1/auth/register"   ->  No login required
module.exports.createUser = ([
    body('userName', 'Enter a valid name').isLength({ min: 3 }).trim(),
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password must be atleast of 5 characters').isLength({ min: 5 }),
], async (req, res) => {
    // If their are errors, return bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        let success = false;
        // check wheather the user with this email exists already
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({ success, error: "sorry a user with this email is already exists!!" });
        }
        const { userName, password, email } = req.body;

        const hashPass = await bcrypt.hash(req.body.password, 12);

        user = await User.create({ userName, email, password: hashPass });
        const data = {
            user: {
                id: user._id
            }
        }
        // const authtoken = jwt.sign(data, process.env.JWT_SECRET);
        success = true;

        res.status(200).send({
            success,
            message: "user registered successfully",
            result: user
        })
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error!!");
    }
});

// Route 2: Authenticate a user using: POST "/api/v1/auth/login"   ->  No login required
module.exports.loginUser = ([
    body('email', 'Enter a valid email').isEmail().normalizeEmail().trim(),
    body('password', 'Password cannot be blank').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { email, password } = req.body;
        let success = false;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success, error: "Please try to login with correct credentials!!" });
        }
        const validUser = await bcrypt.compare(password, user.password);
        if (!validUser) {
            return res.status(400).json({ error: "Please try to login with correct credentials!!" });
        }
        const data = {
            user: {
                id: user._id,
                name: user.userName
            }
        }

        const authtoken = jwt.sign(data, process.env.JWT_SECRET);
        success = true;
        res.status(200).send({
            success,
            message: "User logdin successfully!",
            token: authtoken,
            data: data
        })
    } catch (error) {
        console.error(error.message);
        res.send(500).send("Internal server error!!");
    }
});

module.exports.logoutUser = asyncMiddleware(async (req, res) => {
    if (req.session) {
        req.session.destroy();
        return res.send({
            message: "logout successfully"
        });
    }
});

module.exports.forgotPasswordGet = ((req, res) => {
    res.render('forgot-password');
});


module.exports.forgotPasswordPost = ([
    body('email', 'Enter a valid email').isEmail().normalizeEmail().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { email } = req.body;
        let success = false;
        // make sure user exist in database
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success, error: "user not registered from this email" });
        }
        // user exist and now create one time password valid for 15 minutes 
        const secret = process.env.JWT_SECRET + user.password;
        const payload = {
            email: user.email,
            id: user.id
        }
        const token = jwt.sign(payload, secret, { expiresIn: '15m' });
        const link = `http://localhost:3000/reset-password/${user.id}/${token}`;

        // have to send reset pass email by node mailer  
        const msg = {
            from: "aqibali.cse18@satyug.edu.in", // sender address
            to: "aqibali0401@gmail.com", // list of receivers
            subject: "Hello ✔ NodeMailer testing", // Subject line
            // text: `this is link for reset password ->  ${link}`, // plain text body
            html: ` <h1>This is mail form Split Wise Clone By Aqib</h1>
         <a href="${link}" style="color: blue;">Click here for reset password</a>`, // html body
        }
        nodemailer.createTransport({
            service: 'gmail.com',
            auth: {
                user: "aqibali.cse18@satyug.edu.in",
                pass: "jnfpuwfzyybzdpsc"

            },
            port: 465,
            host: 'smtp.gmail.com'
        })
            .sendMail(msg, (err) => {
                if (err) {
                    console.log('Error occurs ', err);
                } else {
                    console.log('Email sent successfully!!');
                }
            })

        success = true;
        res.status(200).send({
            success,
            message: `Password reset link has been sent to your emai -> ${email}.`,
            result: link
        })
    } catch (error) {
        console.error(error.message);
        res.send(500).send("Internal server error!!");
    }
});

module.exports.resetPasswordGet = (async (req, res) => {
    const { id, token } = req.params;
    let success = false;
    const user = await User.findById(id);
    if (!user) {
        return res.status(400).json({ success, error: "user not registered from this email" });
    }
    // we have valid id, and we have a valid user with this id
    const secret = process.env.JWT_SECRET + user.password;
    try {
        const payload = jwt.sign(token, secret);
        // res.render('reset-password', { email: user.email });
        res.status(200).send({
            message: "token authenticated",
            result: true
        })
    } catch (error) {
        console.log("error aya bhai", error.message);
        res.send(error.message);
    }
});

module.exports.resetPasswordPost = (async (req, res) => {

    const { id, token } = req.params;
    let success = false;
    // check if the id exist in the database or not
    const user = await User.findById({ _id: id });
    const { password, password2 } = req.body;
    if (!user) {
        return res.status(400).json({ success, error: "user not exist with this id...." });
    }

    const secret = process.env.JWT_SECRET + user.password;


    try {
        const payload = jwt.verify(token, secret);
        // validate password and password2 should match
        if (password !== password2) {
            return res.send('Password and Confirm Password are not matching...');
        }
        // we can simply find the user using payload email and id and finally update with new password
        const hashedPassword = await bcrypt.hash(password, 12);
        user.password = hashedPassword;
        user.save();


        success = true;
        res.status(200).send({
            success,
            message: `password has been updated...`
        })
    } catch (error) {
        console.error(error.message);
        res.send(500).send("Internal server error!!", error.message);
    }
});

module.exports.inviteFriend = ([
    body('email', 'Enter a valid email').isEmail().normalizeEmail().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }
    try {
        const { email } = req.body;
        let success = false;

        // make sure user does not exist in database
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).jsons({ success, error: "User already registerd with us!!" });
        }

        // const link = `http://localhost:5000/api/v1/auth/createuser`;
        const link = `http://localhost:3000/signup`;

        // have to send invite email by node mailer  
        const msg = {
            from: "aqibali.cse18@satyug.edu.in", // sender address
            to: `${email}`, // list of receivers
            subject: "Hello ✔ NodeMailer testing for User invitation", // Subject line
            // text: `this is link for reset password ->  ${link}`, // plain text body
            html: ` <h1>This is mail form Split Wise Clone By Aqib</h1>
            <h3>Hi your friend invites you to Splitwise for share expenses</h3>
         <a href="${link}" style="color: blue;">Click here for register with splitwise</a>`, // html body
        }
        nodemailer.createTransport({
            service: 'gmail.com',
            auth: {
                user: "aqibali.cse18@satyug.edu.in",
                pass: "jnfpuwfzyybzdpsc"
            },
            port: 465,
            host: 'smtp.gmail.com'
        })
            .sendMail(msg, (err) => {
                if (err) {
                    console.log('Error occurs ', err);
                } else {
                    console.log('Invitation Email sent successfully!!');
                }
            })

        success = true;
        return res.status(200).send({
            success,
            message: `Invitation mail has sent to ${email} successfully!!`
        })

    } catch (error) {
        console.error(error.message);
        res.status(500).send({ error: "Invalid email id or some error occur!" });
    }
})



