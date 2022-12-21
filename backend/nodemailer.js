const nodemailer = require('nodemailer');

const msg = {
    from: "aqibali.cse18@satyug.edu.in", // sender address
    to: "cremmoihettesu-5551@yopmail.com", // list of receivers
    subject: "Hello ✔ NodeMailer testing", // Subject line
    text: "Hello world? first mail", // plain text body
    html: "<b>Hello world?</b>", // html body
}

nodemailer.createTransport({
    service: 'gmail.com',
    auth: {
        user: "aqibali.cse18@satyug.edu.in",
        pass: "lirviciacetikmhr"
    },
    port: 465,
    host: 'smtp.gmail.com'
})

.sendMail(msg, (err) => {
    if(err){
        return console.log('Error occurs ', err);
    }else{
        return console.log('Email sent');
    }
})