const bodyParser = require('body-parser')
const express = require('express')
const axios = require('axios');
const app = express()
const cors = require('cors')
const mailer = require('nodemailer')
require('dotenv').config()

let urlencodedParser = bodyParser.urlencoded({ extended: true })

const corsOpts = {
    origin: [process.env.ORIGIN1, process.env.ORIGIN2],
    optionsSuccessStatus: 200 
  }

app.use(cors())

app.use(bodyParser.urlencoded({entended: false}))
app.use(bodyParser.json())

app.get('/', (req, res)=> {
        res.send('<h1>A One Landscaping Mail Proxy</h1>')
})

app.post('/send', urlencodedParser, (req, res)=>{
    console.log('hello');
    axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.SECRET_CAPTCHA_KEY}&response=${req.body.captcha}`)
    .then((response)=>{
        if(response.data.success == true){
            if((/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/).test(req.body.email)){
                let service = '';

                console.log(response.data);

                switch(req.body.service){
                    case '1':
                        service = "Landscaping";
                        break;


                    case '2':
                        service = "Hardscaping";
                        break;


                    case '3':
                        service = "Snow Removal";
                        break;

                        
                    default:
                        service = "";
                }

                console.log(service);
            
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
                        <img style="max-height: 50px;" src="https://a1landscaping.s3.ca-central-1.amazonaws.com/img/a1-logo.png"/>
                        <h2 style="margin: 0; color: lightgray;">Landscaping Inc.</h2>
                    </div>
                `
            
                let transporter = mailer.createTransport({
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
                    from: `"A-One Landscaping Services" ${process.env.EMAIL_USERNAME}`,
                    to: process.env.A_ONE_EMAIL,
                    subject: `[Quote Request] A-One - You've Got A Message!`,
                    text: `Hello, You've recieved a quote request for ${service} services.`,
                    html: output
                }
            
        
                transporter.sendMail(options, (error, info) => {
                    if(error){
                        console.log(error);
                        return res.json({"Success": false, "msg":"unknownk error"});
                    }else{
                        console.log('Message sent: %s', info)
                        let confirmMsg = `
                            <h2>Successful Delivery!</h2>
                            <hr>
                            <h3>Details:</h3>
                            <ul>
                                <li>Name: ${req.body.name}</li>
                                <li>Phone No.: ${req.body.phone}</li>
                                <li>Email: ${req.body.email}</li>
                                <li>Service Type: ${service}</li>
                            </ul>
                            <h4>Message</h4>
                            <p>${req.body.message}</p>
                            <br>
                            <br>
                            <p>Your message has been successfully delivered, we will be in touch with you shortly.</p>
                            <hr>
                            <small>This is an automatically generated message, please do not reply to this email.</small>
                            <div>
                            <img style="max-height: 50px;" src="https://a1landscaping.s3.ca-central-1.amazonaws.com/img/a1-logo.png"/>
                            <h2 style="margin: 0; color: lightgray;">Landscaping Inc.</h2>
                        </div>
                        `
            
                        let confirmOpts = {
                            from: process.env.EMAIL_USERNAME,
                            to: req.body.email,
                            subject: `A-One Landscaping - Delivery Status`,
                            text: `Hi ${req.body.name}, your message to A-One Landscaping has
                            been successfully delivered.`,
                            html: confirmMsg,
                        }
        
                        transporter.sendMail(confirmOpts, (error, info) => {
                            if(error){
                                console.log(error);
                                return res.json({Success: false, "msg":"unknownk error"});
                            }else{
                                console.log('Confirmation message sent: %s', info.accepted)
                                return res.json({Success: true, "msg":"Successfully delivered"});
                            }
                        })
                    }
                })
            }else{
                console.log("Email not formatted properly");
                return res.json({Success: false, "msg":"Email not formatted properly"});
            }
        }else{
            console.log("Captcha verification failed");
            return res.json({Success: false, "msg":"Captcha verification failed"});
        }
    }).catch((error)=>{
        console.log(error);
        return res.json({Success: false, "msg": error});
    })


})

app.listen(PORT, ()=>{
    console.log(`listening on port ${PORT}`);
})


