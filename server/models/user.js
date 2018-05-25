const mongoose = require('mongoose');
const validator = require('validator');
var User = mongoose.model('User', {
    email: {
        type: String,
        required: true,
        trim: true,
        minlength: 6,
        unique: true,
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email'
        }
    },
    phoneNumber: {
        type: String,
        required: true,
        trim:true,
        minlength: 10,
        unique: true,
    },
    name: {
        type: String,
        required: true,
        trim:true,
        minlength: 2
    },
    licensePlates: {
        type: String,
        required: true,
        trim: true,
        minlength: 6
    },
    verified: {
        type: Boolean,
        default: false,
    },
})

module.exports = {User};
