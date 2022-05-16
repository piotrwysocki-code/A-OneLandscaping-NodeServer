const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const app = express()
const mailer = require('nodemailer')
const request = require('request')
require('dotenv').config()

const corsOpts = {
    origin: [process.env.ORIGIN1, process.env.ORIGIN2],
    optionsSuccessStatus: 200 
  }

app.use(cors(corsOpts))

let urlencodedParser = bodyParser.urlencoded({ extended: true })

app.use(bodyParser.urlencoded({entended: false}))
app.use(bodyParser.json())

app.get('/', (req, res)=> {
    res.send('<h1>A One Landscaping Mail Proxy</h1>');
});

app.post('/verify', (req, res)=>{    
    const verifyUrl =`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.SECRET_CAPTCHA_KEY}&response=${req.body.captcha}&remoteip=${req.socket.remoteAddress}`

    request(verifyUrl, (err, response, body) => {
        body = JSON.parse(body);

        if(req.body.captcha === "" ||
        req.body.captcha === undefined ||
        req.body.captcha === null ){
            return res.json({"success": false, "msg":"Captcha not filled out"});
        }

        if(body.success !== undefined && !body.success){
            return res.json({"success": false, "msg":"Failed the captcha verification"});
        }

        return res.json({"success": true, "msg":"Passed the captcha"});
    })

})  

app.post('/send', urlencodedParser, (req, res)=>{
    console.log(req.body)

    let service;

    switch(req.body.service == 0){
        case 0:
            service = "Snow Removal";
        case 1:
            service = "Hardscaping";
        case 2:
            service = "Landscaping";
        default:
            service = "N/A";
    }

    const output = `
        <h2>You have a new request for a quote!</h2>
        <hr>
        <h3>Contact Details:</h3>
        <ul>
            <li>Name: ${req.body.name}</li>
            <li>Phone No.: ${req.body.phone}</li>
            <li>Email: ${req.body.email}</li>
            <li>Service Type: ${service}</li>
        </ul>
        <h4>Message</h4>
        <p>${req.body.message}</p>
        <hr>
        <div>
            <img style="width: 56; height: 40.65;" src="https://a1landscaping.s3.ca-central-1.amazonaws.com/img/a1-logo.png"/>
            <h2 style="margin: 0;">Landscaping Inc.</h2>
        </div>
    `

    let trainsporter = mailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        },
        tls:{
            rejectUnauthorized: true
        }
    })

    let options = {
        from: `"A-One Landscaping Services" ${process.env.A_ONE_EMAIL}`,
        to: process.env.A_ONE_EMAIL,
        subject: `[Quote Request] A-One - You've Got A Message!`,
        text: `Hello, You've recieved a quote request for ${service} services.`,
        html: output
    }

    trainsporter.sendMail(options, (error, info) => {
        if(error){
            res.status(error)
            return console.log(error)
        }
        console.log('Message sent: %s', info.messageId)
        console.log('Preview URL: %s', mailer.getTestMessageUrl(info))
    })

    res.status(200).send(req.body)
})
