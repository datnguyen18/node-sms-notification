var mongoose = require('mongoose');

var User = mongoose.model('User', {
    email: {
        type: String,
        required: true,
        trim: true,
        minlength: 6,
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
