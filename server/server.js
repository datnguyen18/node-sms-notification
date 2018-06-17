const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const Client = require('authy-client').Client;
const authy = new Client({ key: "B2pxj5Oqh7sCnuqpjFSJW8trknK0y766" })
const enums = require('authy-client').enums;
var cors = require('cors');
var { mongoose } = require('./db/mongoose');
var { User } = require('./models/user');

const accountSid = 'AC5361795ce96c6fbfe377adc697fe1459';
const authToken = 'f17317fac3a7fef8448fc2d11cc7215e';
const client = require('twilio')(accountSid, authToken);

var app = express();

const port = process.env.PORT || 8000;
app.use(cors());
app.use(bodyParser.json());

app.post('/registry', (req, res) => {
    var body = _.pick(req.body, ['email', 'phoneNumber', 'name', 'licensePlates'])
    var user = new User(body)

    user.save().then((doc) => {
        res.send(doc);
    }).catch((e) => {
        res.status(400).send(e)
    })
})

app.post('/user-info', (req, res) => {
    var body = _.pick(req.body, ['phoneNumber']);

    User.findOne({ phoneNumber: body.phoneNumber }, (err, doc) => {
        if (!doc) {
            return res.status(400).send({ "error": "Phone number not registered" })
        }
        else if (!doc.verified) {
            return res.status(400).send({ "error": "Phone number   not verified" })
        }

        res.send(doc)
    })

})

app.post('/req-verify-phone', (req, res) => {
    var body = _.pick(req.body, ['phoneNumber']);
    var phoneNumber = body.phoneNumber;
    authy.startPhoneVerification({ countryCode: 'VN', locale: 'en', phone: phoneNumber, via: enums.verificationVia.SMS }, (error, response) => {
        if (error) { return console.log(error) };

        res.send(response)
    });
})

app.post('/verify-code', (req, res) => {
    var body = _.pick(req.body, ['code', 'phoneNumber']);
    var code = body.code;
    var phoneNumber = body.phoneNumber;
    authy.verifyPhone({ countryCode: 'VN', phone: phoneNumber, token: code }, (error, response) => {
        if (error) return res.status(404).send({ "error": "code was wrong" });

        User.findOneAndUpdate({ phoneNumber }, { $set: { verified: true } }, { new: true }).then((user) => {
            if (!user) {
                return res.status(404).send();
            }
            res.send(user)
        }).catch((e) => {
            res.status(400).send("Code was wrong")
        })
    });
})

app.post('/report-violation', (req, res) => {
    var body = _.pick(req.body, ['licensePlates', 'reason', 'date','address','money']);
    var licensePlates = body.licensePlates;
    var reason = body.reason;
    var date = body.date;
    var address = body.address;
    var money = body.money;
    var violation = { reason: reason, date: date, address: address, money: money }

    var content = `[VIETTEL][CSGT-BD] Quy khach vua vi pham loi: ${reason} tại ${address} vào lúc ${formatDate(new Date(parseInt(date)))}; voi muc phat ${money}. Vui long nop phat truc tiep tai kho bac nha nuoc hoac qua the ngan hang. Kiem tra loi vi pham tai: cgstbinhduong.gov.vn `
    console.log(content)
    User.findOneAndUpdate({ licensePlates }, { $push: { violations: violation } }, { new: true }).then((user) => {
        if (!user) {
            return res.status(404).send();
        }
        const phoneNumber = '+84' + user.phoneNumber.substring(1, user.phoneNumber.length);
        client.messages.create({
            body: content,
            from: '+447480486696',
            to: phoneNumber
        })
            .then(message => console.log(message.sid)).done();

        res.send(user);
    }).catch((e) => {
        res.status(400).send(e);
    })
})
app.listen(port, () => {
    console.log(`Started on port ${port}`);
})

formatDate = (date) => {
    const monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];

    const day = date.getDate();
    const monthIndex = date.getMonth() +1;
    const year = date.getFullYear();
    const hour = date.getHours();
    const minutes = date.getMinutes();
    const second = date.getSeconds();

    return hour + ':' + minutes + ':' + second+ ' ' + day + ' ' + monthIndex + ' ' + year;
}