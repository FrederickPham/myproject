

var app = require('express').Router(),
    fs = require('fs'),
    Models = require('../models'),
    User = Models.user,
    email = require('./libs/email'),
    _ = require('underscore'),
    User_service = require('./libs/user.service'),
    utils = require('./libs/utils');




function successHandler(res, data, pageNumber, pageSize, totals) {

    res.send({
        success: true,
        pageNumber: pageNumber,
        pageSize: pageSize,
        totals: totals,
        data: data
    });

};


/**
 * @api GET, PUT, POST, PACTH, DELETE  /api/users/*
 * Version 1.0
 * @param {pageSize} /query pageSize
 * @param {pageNumber} /query pageNumber
 * 
 * 
 */


app.all('/*', function (req, res, next) {

    try {
        var originalUrl = req.originalUrl;
        req.pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
        req.pageNumber = req.query.pageNumber ? parseInt(req.query.pageNumber) : 1;

        if (!utils.checkOriginalUrlNotUseAuth(originalUrl)) {

            User_service.checkAccessToken(req, function (err, data) {

                if (err)
                    return next(err)
                if (!data)
                    return next()
                if (data instanceof Error)
                    return next(data)



                req.header.current_user = data;

                next()
                //to do role 
            })
        }

        else
            next()


    } catch (error) {

        return next(error)
    }

})

    .get('/get-me', function (req, res, next) {
        return successHandler(res, req.header.current_user)
    })

    .get('/', function (req, res, next) {

        User.count().exec(function (err, counts) {

            if (err)
                return next(err)

            if (counts == 0)
                return successHandler(res, [])

            var checkOutRage = utils.checkOutRage(req.pageNumber, req.pageSize, counts)
            if (checkOutRage)
                return next(checkOutRage)


            User.find().skip((req.pageNumber - 1) * req.pageSize).limit(req.pageSize).exec(function (error, succes) {
                console.log('test next')
                if (error)
                    return next(error)

                return successHandler(res, succes, req.pageNumber, req.pageSize, counts)
            })
        })
    })

    .get('/active', function (req, res, next) {

        User.count({ active: true }).exec(function (err, counts) {

            console.log('counts', err, counts)
            if (err)
                return next(err)

            if (counts == 0)
                return successHandler(res, [])

            var checkOutRage = utils.checkOutRage(req.pageNumber, req.pageSize, counts)
            if (checkOutRage)
                return next(checkOutRage)


            User.find({ where: { active: true } }).skip((req.pageNumber - 1) * req.pageSize).limit(req.pageSize).exec(function (error, succes) {

                if (error)
                    return next(error)

                return successHandler(res, succes, req.pageNumber, req.pageSize, counts)
            })
        })

    })

    .post('/register', function (req, res, next) {

        var newUser = req.body;

        if (newUser.userName) {
            if (!utils.checkSpecialCharacters(newUser.userName))
                return next(utils.createReturnError('userName can not use  Special Characters'))
        }
        User.create(newUser).then(function (succes) {
            console.log('data', succes)
            return successHandler(res, succes)
        }, function (err) {
            return next(err);
        })

    })

    .put('/active-account', function (req, res, next) {

        var code = req.body.verifycode;
        var email = req.body.email;


        if (!code || !email)
            return next(utils.createReturnError('verifycode and email can not blank '))

        User.findOne({
            emails: {
                $elemMatch: {
                    value: email
                }
            }
        }).then(function (data) {
            if (!data)
                return next(utils.createReturnError('Email invalid'))
            data.identity.every(function (item) {
                if (!item.identitynumberIsVerified && item.identitynumber === code) {

                    item.identitynumberIsVerified = true;
                    data.verified = true;
                    data.active = true;
                    data.save().then(function (succes) {
                        return successHandler(res)
                    })
                }

                else
                    return next(utils.createReturnError('verifycode invalid'))

            })






        }, function (err) {
            next(err)
        })

    })

    .put('/update-profile/:id', function (req, res, next) {

        var updateParams = req.body;


        User.update({ _id: req.params.id }, updateParams, function (err, affected, data) {
            if (err)
                return next(err)

            if (!affected)
                return next(utils.createReturnError('Not found user'))

            return successHandler(res, affected)
        })



    })


    .delete('/:id', function (req, res, next) {

        var id = req.params.id;
        User.findByIdAndRemove(id).then(function () {
            return successHandler(res)
        }, function (err) {
            return next(err)
        })

    })


    .put('/login', function (req, res, next) {


        var body = req.body;

        if (!body.password || !body.userName)
            return next(utils.createReturnError('userName and password can not blank'));

        if (!body.deviceId)
            return next(utils.createReturnError('deviceId is required'))

        var credentials = {
            password: body.password,
            deviceId: body.deviceId
        };




        if (body.userName.indexOf('@') > -1)
            credentials.email = body.userName
        else
            credentials.userName = body.userName


        User_service.login(req, credentials, function (err, succes) {

            if (err) {
                if (err instanceof Error)
                    return next(err)
                else
                    return res.send({
                        success: true,
                        message: err
                    });
            }

            else
                return successHandler(res, succes)
        })
    })


    .put('/forgot-password', function (req, res, next) {

        var emp = req.body.email;

        if (!emp)
            return next(utils.createReturnError('Email or phone required'));
        else
            var filter = {
                $elemMatch: {
                    value: emp,
                    primary: true
                }
            };

        var query = {};
        var check;

        if (emp.indexOf('@') > -1) {
            query = {
                emails: filter
            };
            check = 'email';
        }
        else {
            query = {
                phoneNumbers: filter
            };
            check = 'phone number'
        }


        User.findOne(query).then(function (data) {

            if (!data)
                return next(utils.createReturnError(check + ' Invalid'));


            var code = utils.generateVerifyCode();
            var _identity = data.identity
            _identity.push({ identitynumber: code, identitynumberIsVerified: false });


            User.update({ _id: data._id }, { identity: _identity }, function (err, data) {

                if (err)
                    return next(err)
                if (data) {

                    email.transporterEmail(emp, 'Forgot Password', '', email.sendActiveCode(code))

                    return res.send({
                        success: true,
                        message: 'Please check verify code in your email',
                        status: 200
                    })
                }
            })


        }, function (err) {
            return next(err);
        })

    })


    .put('/login-newdevice', function (req, res, next) {


        var username = req.body.userName,
            code = req.body.code,
            deviceId = req.body.deviceId;



        var query = {
            identity: {
                $elemMatch: {
                    passport: code,
                    passportIsVerified: false
                }
            }
        }

        if (username.indexOf('@') > -1)

            query.emails = {
                $elemMatch: {
                    value: username
                }
            }


        else
            query.userName = username



        User.findOne(query).then(function (data) {

            if (!data)
                return next(utils.createReturnError('verifycode incorrect'));
            data.identity.forEach(function (element) {
                if (element.passport == code && !element.passportIsVerified)
                    return element.passportIsVerified = true;
            }, this);
            data.devices.push({ id: deviceId });
            data.save().then(function (succes) {
                console.log(succes);

                return successHandler(res, succes)


            });




        }, function (err) {
            return next(err)
        })



    })

    .post('/new-password', function (req, res, next) {
        var emp = req.body.email;
        var password = req.body.newPassword;
        var code = req.body.verifycode;

        if (!password)
            return next(utils.createReturnError('newPassword requried'));

        if (!code)
            return next(utils.createReturnError('verifycode required'))

        if (!emp)
            return next(utils.createReturnError('Email or phone required'));
        else
            var filter = {
                $elemMatch: {
                    value: emp,
                    primary: true
                }
            };

        var query = {};
        var check;


        if (emp.indexOf('@') > -1) {
            query = {
                emails: filter

            };
            check = 'email';
        }
        else {
            query = {
                phoneNumbers: filter
            };
            check = 'phone number'
        }

        User.findOne(query).then(function (data) {
            if (!data)
                return next(utils.createReturnError(check + ' invalid'))

            var checkCode = false
            var count = 0;
            data.identity.forEach(function (item) {
                count += 1
                if (item && !item.identitynumberIsVerified && item.identitynumber && item.identitynumber === code) {
                    checkCode = true;
                    item.identitynumberIsVerified = true;
                }


                if (count == data.identity.length) {
                    if (checkCode) {
                        data.verified = true;
                        data.password = password;
                        data.save().then(function (succes) {
                            return successHandler(res)
                        })
                    }
                    else
                        return next('verifycode invalid')
                }
            }, this)


        })


    });








module.exports = app;