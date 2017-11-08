
var Models = require('../../models'),
    Wallet = Models.wallet,
    bcrypt = require('bcrypt'),
    utils = require('./utils');



module.exports.patchBalance = function (current_wallet, balance, cb) {
    cb = cb || utils.createPromiseCallback()
    console.log('balance', balance);
    let checkParam = validateWallet(balance);

    if (checkParam)
        cb(utils.createReturnError(checkParam))

    if (current_wallet.balance.length == 0) {
        current_wallet.balance.push(balance);
        cb(null, current_wallet)
    }
    else {
        var check = false
        current_wallet.balance.forEach(function (element) {
            if (element.name == balance.name.toLowerCase()) {
                check = true;
                for (var key in balance) {
                    if (balance.hasOwnProperty(key)) {
                        if (key === 'quantity')
                            element[key] += balance[key]
                        else
                            element[key] = balance[key]
                    }
                }
            };

        }, this);

        if (check)

            cb(null, current_wallet)
        else {


            current_wallet.withdraw.push(balance);

            cb(null, current_wallet)
        }


    }


    return cb.promise;
};


module.exports.withdraw = function (current_wallet, withdraw, cb) {

    let checkParam = validateWallet(withdraw);
    if (checkParam)
        cb(utils.createReturnError(checkParam))

    if (current_wallet.balance.length == 0)
        cb(utils.createReturnError('no balance'))
    else {
        var check = false
        var count = 0;
        var isEnoughAmount = true;
        current_wallet.balance.forEach(function (element) {
            count += 1
            if (element.name == withdraw.name.toLowerCase()) {
                check = true
                for (var key in withdraw) {
                    if (withdraw.hasOwnProperty(key)) {
                        if (key === 'amount') {
                            if (element['quantity'] < withdraw[key]) {
                                isEnoughAmount = false
                            } else {
                                element['quantity'] -= withdraw[key]
                            }
                        }
                    }
                }
            }


            if (count == current_wallet.balance.length) {

                if (!check)
                    cb(utils.createReturnError('can not find ' + withdraw.name + ' in balance'))
                else {
                    if (!isEnoughAmount)
                        cb(utils.createReturnError('can not isEnoughAmount amount for withdraw'))
                    else {
                        current_wallet.withdraw.push(withdraw);
                        cb(null, current_wallet)
                    }
                }
            }
        })

    }

    return cb.promise;

}


module.exports.deposit = function (current_wallet, deposit, cb) {
    cb = cb || utils.createPromiseCallback();
    let checkParam = validateWallet(deposit);
    if (checkParam) cb(utils.createReturnError(checkParam))

    var count = 0;
    var checkdes = false
    current_wallet.balance.forEach(function (element) {
        count += 1

        if (element.name == deposit.name.toLowerCase()) {
            checkdes = true
            element['quantity'] += deposit.amount;
            current_wallet.deposit.push(deposit)
        }



        if (count == current_wallet.balance.length) {
            if (checkdes)
                cb(null, current_wallet)
            else {
                var balance = deposit;
                balance.quantity = deposit.amount;

                current_wallet.balance.push(balance);

                current_wallet.deposit.push(deposit)
                cb(null, current_wallet)
            }
        }
    })

    return cb.promise;

}



function validateWallet(field) {
    var err = null
    if (!field)
        err = 'body ' + field + ' required';
    if (!field.name)
        err = 'name required';
    if (field.quantity)
        field.amount = field.quantity;
    if (!field.amount)
        err = 'amount required';
    if (typeof field.amount != 'number')
        err = 'amount required number';
    if (field.amount <= 0)
        err = 'amount too small';

    return err
}