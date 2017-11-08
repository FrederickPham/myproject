
var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    email = require('../routes/libs/email'),
    utils = require('../routes/libs/utils'),
    bcrypt = require('bcrypt'),
    SALT_WORK_FACTOR = 10,
    MAX_PASSWORD_LENGTH = 72,
    uid = require('uid2'),
    DEFAULT_TOKEN_LEN = 64,
    _ = require('underscore');


mongoose.Promise = require('bluebird');


var User = Schema({
    userName: {
        type: String,
        lowercase: true,
        required: true,
        unique: true,

    },
    password: {
        type: String,
        required: true
    },
    accessToken: {
        type: String,
        unique: true
    },
    name: {
        familyName: {
            type: String,
            required: true
        },
        givenName: {
            type: String,
            required: true
        },
        middleName: {
            type: String
        }
    },
    reference: {
        type: [
            {
                id: { type: ObjectId },
                name: { type: String },
                _id: false
            }
        ]
    },

    devices: {
        type: [
            {
                id: { type: String, required: true },
                token: { type: String },
                name: { type: String },
                _id: false
            }
        ]
    },
    identity: {
        type: [
            {
                identitynumber: { type: String },
                identitynumberIsVerified: { type: Boolean },
                passport: { type: String },
                passportIsVerified: { type: Boolean },
                _id: false
            }
        ]
    },
    bank: {
        type: [
            {
                accoutNumber: { type: String },
                name: { type: String },
                isVerified: { type: Boolean },
                _id: false
            }
        ]
    },
    address: {
        type: [
            {
                number: { type: String, required: true },
                street: { type: String, required: true },
                district: { type: String, required: true },
                city: { type: String },
                cityCode: { type: String },
                province: { type: String },
                provinceCode: { type: String },
                country: { type: String, required: true },
                countryCode: { type: String, required: true },
                zipCode: { type: Number },
                _id: false
            }
        ], required: true
    },
    avatar: {
        type: [
            {
                _id: false,
                value: { type: String },
                active: { type: Boolean },
            }
        ]
    },
    phoneNumbers: {
        type: [
            {
                value: { type: String },
                primary: { type: Boolean },
                _id: false
            }
        ]
    },
    emails: {
        type: [
            {
                value: { type: String, required: true, unique: true, lowercase: true, match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'] },
                primary: { type: Boolean, required: true },
                _id: false
            }
        ], required: true
    },
    groups: {
        type: [
            {
                id: { type: String, required: true },
                name: { type: String, required: true },
                _id: false
            }
        ], required: true
    },
    active: {
        type: Boolean,
        required: true,
        default: false
    },
    verified: {
        type: Boolean,
        required: true,
        default: false
    },
    passwordLastModified: { type: String },
    lastLogonTime: { type: Date },
    createdAt: {
        type: Date,
        default: new Date()
    },
    update: {
        type: [
            {
                _id: false,
                time: { type: Date },
                updateBy: { type: String },
            }
        ]
    }
});

User.set('versionKey', false);




// before save

User.pre('validate', function (next) {
    var self = this;



    if (self.isNew) {

        if (self.emails && self.emails.length) {
            var emails = _.map(self.emails, function (e) {
                if (e.primary)
                    return e.value
            });

            self.constructor.find({
                emails: {
                    $elemMatch: {
                        value: { $in: emails }
                    }
                }
            }).then(function (data) {
                if (data.length) {
                    next(utils.createReturnError('Email has been exist'))
                    return
                }
                next()
            })
        } else
            next()

    } else

        next();
});



User.pre('save', function (next) {

    var self = this;

    if (!self.isModified('password'))
        return next();
    else {





        self.password = self.hashPassword(self.password);

        self.createAccessToken(function (err, token) {

            if (err)
                return next(err);
            else {
                self.accessToken = token;
                next()
            }
        })
    }

});



User.pre('save', function (next) {

    var self = this;



    if (self.isNew) {
        self.wasNew = self.isNew;
        return next()
    }
    else {
        var update = {
            time: new Date(),
            updateBy: 'to do id user update' //update id update
        };


        self.update.push(update);

        next()
    }


});



User.pre('update', function (next) {
    var self = this;



    var password = self.getUpdate().$set.password;


    if (password) {

        createAccessToken(function (err, token) {

            if (err)
                return next(err)

            self.update({}, { $set: { password: hashPassword(password), accessToken: token } })

            next();

        })

    } else

        next()

    // this.update({}, { $set: { updatedAt: new Date() } });
});







User.methods.hashPassword = hashPassword

function hashPassword(plain) {
    validatePassword(plain);
    var salt = bcrypt.genSaltSync(SALT_WORK_FACTOR);
    return bcrypt.hashSync(plain, salt);
};

function validatePassword(plain) {
    var err;
    if (plain && typeof plain === 'string' && plain.length <= MAX_PASSWORD_LENGTH)
        return true;

    if (plain.length > MAX_PASSWORD_LENGTH) {
        err = utils.createReturnError('Password too long', 422)
        err.code = 'PASSWORD_TOO_LONG';
    } else
        err = utils.createReturnError('Invalid password', 422)

    throw err;
};



User.post('save', function (data) {
    var self = this;
    if (self.wasNew) {

        var emails = _.map(self.emails, function (e) {
            if (e.primary)
                return e.value
        });
        var code = utils.generateVerifyCode();

        var identity = data.identity;
        identity.push({ identitynumber: code, identitynumberIsVerified: false });


        self.constructor.update({ _id: data.id }, { identity: identity }, function (err, affected, resp) {
            email.transporterEmail(emails[0], 'Verify Account', '', email.sendActiveCode(code))
        })

    }

});





User.methods.createAccessToken = createAccessToken;


function createAccessToken(cb) {
    uid(DEFAULT_TOKEN_LEN, function (err, succes) {
        if (err)
            cb(err)
        else
            cb(null, succes)

    })

};








module.exports = User;
// the above is necessary as you might have embedded schemas which you don't export

