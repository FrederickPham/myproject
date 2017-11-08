

var app = require('express').Router(),
    fs = require('fs'),
    Models = require('../models'),
    Wallet = Models.wallet,
    email = require('./libs/email'),
    _ = require('underscore'),
    User_service = require('./libs/user.service'),
    Wallet_servce = require('./libs/wallet.service'),
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
 * @api GET, PUT, POST, PACTH, DELETE  /api/wallet/*
 * Version 1.0
 * @param {pageSize} /query pageSize
 * @param {pageNumber} /query pageNumber
 * 
 * 
 */


app.all('/*', function (req, res, next) {
    try {
        console.log("????", req.originalUrl)

        if (utils.checkOriginalUrlNotUseAuth(req.originalUrl))
            next()

        else {
            User_service.checkAccessToken(req, function (err, data) {

                if (err)
                    return next(err)
                if (!data)
                    return next()
                if (data instanceof Error)
                    return next(data)


                req.header.current_user = data;

                Wallet.findOne({ userId: req.header.current_user.id }).then(function (w) {
                    console.log("??", w)
                    if (w)
                        req.header.wallet = w;
                    next()
                }, function (err) {

                    next()
                })


            })
        }
    } catch (error) {
        return next(error)
    }
})
    .post('/create', function (req, res, next) {

        if (req.header.wallet)
            return next(utils.createReturnError('wallet has been exist'))


        var newWallet = req.body;


        newWallet.userId = req.header.current_user.id;

        Wallet.create(newWallet).then(function (succes) {
            console.log('data', succes)
            return successHandler(res, succes)
        }, function (err) {
            return next(err);
        })


    })

    .get('/', function (req, res, next) {
        if (req.header.wallet)
            return successHandler(res, req.header.wallet)
        else
            return next(utils.createReturnError('You do not have a wallet'))
    })
    .put('/update', function (req, res, next) {


        var updateParams = req.body;


        Wallet.update({ _id: req.header.wallet.id }, updateParams, function (err, affected, data) {
            if (err)
                return next(err)

            if (!affected)
                return next(utils.createReturnError('Not found wallet'))

            return successHandler(res, affected)
        })


    })

    .put('/update/withdraw', function (req, res, next) {

        Wallet_servce.withdraw(req.header.wallet, req.body, function (err, data) {

            if (err)
                return next(err)
            data.save()
            return successHandler(res, data);
        })

    })


    .put('/update/deposit', function (req, res, next) {

        Wallet_servce.deposit(req.header.wallet, req.body, function (err, data) {
            if (err)
                return next(err);

            data.save();
            return successHandler(res, data)


        })

    })

    .patch('/update/balance', function (req, res, next) {
        var balance = req.body;
        Wallet_servce.patchBalance(req.header.wallet, balance, function (err, data) {

            if (err)
                return next(err)

            data.save();

            return successHandler(res, data.balance)


        })
    })


module.exports = app;