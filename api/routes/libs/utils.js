
var moment = require('moment'),
    crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = 'aSjlkvS89';


module.exports.encrypt = function (text) {
    var cipher = crypto.createCipher(algorithm, password);
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
};



module.exports.checkOriginalUrlNotUseAuth = function (originalUrl) {
    let isExist = false;
    let keys = 'register login logout forgot-password active-account new-password login-newdevice'.split(" ");


    keys.forEach(function (k) {
        if (originalUrl.indexOf(k) > -1)
            isExist = true
    }, this)

    return isExist;


};

module.exports.checkSpecialCharacters = function (str) {
    var regex = /^[a-zA-Z0-9]*$/;
    return regex.test(str);
};

module.exports.createReturnError = function (err, status) {
    var error = new Error(err);
    error.status = status || 400;
    return error
};

module.exports.checkOutRage = function (pageNumber, pageSize, counts) {
    let range = (pageNumber - 1) * pageSize;
    var error;
    if (range > counts)
        error = this.createReturnError('Payload Too Large', 413);
    else if (range < 0)
        error = this.createReturnError('Page can not negative')
    else
        error = null

    return error
};

module.exports.generateVerifyCode = function () {
    let result = "";
    result += "000" + Math.floor((Math.random() * 1000));
    return result.slice(-4);
};







module.exports.createPromiseCallback = createPromiseCallback;






function createPromiseCallback() {
    var cb;

    if (!global.Promise) {
        cb = function () { };
        cb.promise = {};
        Object.defineProperty(cb.promise, 'then', { get: throwPromiseNotDefined });
        Object.defineProperty(cb.promise, 'catch', { get: throwPromiseNotDefined });
        return cb;
    }

    var promise = new global.Promise(function (resolve, reject) {
        cb = function (err, data) {
            if (err) return reject(err);
            return resolve(data);
        };
    });
    cb.promise = promise;
    return cb;
}

function throwPromiseNotDefined() {
    throw new Error(
        'Your Node runtime does support ES6 Promises. ' +
        'Set "global.Promise" to your preferred implementation of promises.');
}





