const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const app = express()
const mailer = require('nodemailer')
const exphdlbrs = require('express-handlebars')
const PORT = process.env.PORT || 4000

let urlencodedParser = bodyParser.urlencoded({ extended: true })

app.use(cors())

app.listen(PORT, ()=>{
    console.log(`listening on port ${PORT}`)
})

app.get('/', (req, res)=> {
    res.send('<h1>A1 Mail Proxy</h1>');
});

app.post('/send', urlencodedParser, (req, res)=>{
    console.log(req.body)

    const output = `
        <h3>You have a new request for a quote!</h3>
        <h4>Contact Details:</h4>
        <ul>
            <li>Name: ${req.body.name}</li>
            <li>Phone No. ${req.body.phone}</li>
            <li>Email: ${req.body.email}</li>
            <li>Service Type: ${req.body.service}</li>
            <li>
                <h5>Message</h5>
                <br>
                <p>${req.body.message}</p>
            </li>
        </ul>
    `

    let trainsporter = mailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: 'leechcalculatorbugs@gmail.com',
            pass: 'twitter12'
        },
        tls:{
            rejectUnauthorized: false
        }
    })

    let options = {
        from: '"A1 Landscaping Services" <leechcalculatorbugs@gmail.com',
        to: req.body.email,
        subject: 'A1 - We Got Your Message!',
        text: 'Hi Test, We got your request for a quote!',
        html: output
    }

    trainsporter.sendMail(options, (error, info) => {
        if(error){
            return console.log(error)
        }
        console.log('Message sent: %s', info.messageId)
        console.log('Preview URL: %s', mailer.getTestMessageUrl(info))
    })

    res.status(200).send(req.body)
})

