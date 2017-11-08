
var Models = require('../../models'),
    User = Models.user,
    bcrypt = require('bcrypt'),
    utils = require('./utils'),
    email = require('./email');





User.prototype.comparePassword = function (plain, fn) {
    fn = fn || utils.createPromiseCallback();
    if (this.password && plain) {

        bcrypt.compare(plain, this.password, function (err, isMatch) {
            if (err) return fn(err);
            fn(null, isMatch);
        });
    } else {
        fn(null, false);
    }
    return fn.promise;
};






module.exports.login = function (req, credentials, fn) {

    var self = User;

    
    var accessToken = tokenIdForRequest(req);



    if (!credentials.email && !credentials.userName) {
        fn(utils.createReturnError('userName is required'));
        return fn.promise;
    }


    var query = {};
    // Check if realm is required


    if (credentials.email)

        query = {
            emails: {
                $elemMatch: {
                    value: credentials.email
                }
            }
        }

    else
        query = {
            userName: credentials.userName
        };





    self.findOne(query).then(function (user) {

        console.log(user)
        if (user) {

            if (!user.active)
                fn(utils.createReturnError('user inactive'))
            else


                user.comparePassword(credentials.password, function (err, isMatch) {

                    if (err) {
                        console.log('An error is reported from User.comparePassword: %j', err);
                        fn(utils.createReturnError('login failed'));
                    } else if (isMatch) {

                        if (user.devices.length <= 0) {
                            user.devices.push({ id: credentials.deviceId });
                            updateLogin(user, fn)
                        }
                        else {
                            var check = false, count = 0;


                            user.devices.forEach(function (element) {
                                count += 1;
                                if (element.id === credentials.deviceId)
                                    check = true;
                            }, this);

                            if (count == user.devices.length) {
                                console.log('ac', check)
                                if (check)
                                    updateLogin(user, fn)
                                else {

                                    let code = utils.generateVerifyCode();
                                    user.identity.push({
                                        passport: code,
                                        passportIsVerified: false
                                    });
                                    user.waitAuthDevice = credentials.deviceId;
                                    user.save()
                                    email.transporterEmail(user.emails[0].value, 'Verify Device', '', email.sendActiveDevice(code));

                                    fn('Thiết bị đăng nhập chưa được xác thực, vui lòng xác nhận để tiếp tục đăng nhập')

                                }


                            }

                        }

                    } else {
                        console.log('The password is invalid for user %s', query.email || query.userName);
                        fn(utils.createReturnError('The password is invalid for user'));
                    }
                });

        } else {
            console.log('No matching record is found for user %s', query.emails || query.userName);
            fn(utils.createReturnError('No matching record is found for user'));
        }
    }, function (err) {

        console.log(err)
        fn(utils.createReturnError('System error', 500));

    });
    return fn.promise;
};

function updateLogin(user, fn) {
    user.lastLogonTime = new Date();
    user.save()
    fn(null, user)
}




// // Define constant for the wildcard
// AccessContext.ALL = '*';

// // Define constants for access types
// AccessContext.READ = 'READ'; // Read operation
// AccessContext.REPLICATE = 'REPLICATE'; // Replicate (pull) changes
// AccessContext.WRITE = 'WRITE'; // Write operation
// AccessContext.EXECUTE = 'EXECUTE'; // Execute operation

// AccessContext.DEFAULT = 'DEFAULT'; // Not specified
// AccessContext.ALLOW = 'ALLOW'; // Allow
// AccessContext.ALARM = 'ALARM'; // Warn - send an alarm
// AccessContext.AUDIT = 'AUDIT'; // Audit - record the access
// AccessContext.DENY = 'DENY'; // Deny

// AccessContext.permissionOrder = {
//     DEFAULT: 0,
//     ALLOW: 1,
//     ALARM: 2,
//     AUDIT: 3,
//     DENY: 4
// };


module.exports.checkAccessToken = function (req, fn) {

    fn = fn || utils.createPromiseCallback()

    var accessToken = tokenIdForRequest(req)


    console.log('tét', accessToken)
    if (accessToken) {

        User.findOne({ accessToken: accessToken }).then(function (data) {

            if (!data || !data.active)
                fn(utils.createReturnError('Invalid Access Token', 401))
            else
                fn(null, data) //to do set role AccessContext

        }, function (err) {

            fn(err)
        })
    } else
        fn(null, utils.createReturnError('accesstoken required'))


    return fn.promise




};



function tokenIdForRequest(req) {
    var params = [];
    var headers = [];
    var cookies = [];
    var i = 0;
    var length;
    var id;


    params = params.concat(['access_token', 'accesstoken']);
    headers = headers.concat(['X-Access-Token', 'authorization', 'accesstoken']);
    cookies = cookies.concat(['access_token', 'authorization', 'accesstoken']);


    for (length = params.length; i < length; i++) {
        var param = params[i];
        // replacement for deprecated req.param()
        id = req.params && req.params[param] !== undefined ? req.params[param] :
            req.body && req.body[param] !== undefined ? req.body[param] :
                req.query && req.query[param] !== undefined ? req.query[param] :
                    undefined;

        if (typeof id === 'string') {
            return id;
        }
    }

    for (i = 0, length = headers.length; i < length; i++) {
        id = req.header(headers[i]);

        if (typeof id === 'string') {
            // Add support for oAuth 2.0 bearer token
            // http://tools.ietf.org/html/rfc6750
            if (id.indexOf('Bearer ') === 0) {
                id = id.substring(7);
                // Decode from base64
                var buf = new Buffer(id, 'base64');
                id = buf.toString('utf8');
            } else if (/^Basic /i.test(id)) {
                id = id.substring(6);
                id = (new Buffer(id, 'base64')).toString('utf8');
                // The spec says the string is user:pass, so if we see both parts
                // we will assume the longer of the two is the token, so we will
                // extract "a2b2c3" from:
                //   "a2b2c3"
                //   "a2b2c3:"   (curl http://a2b2c3@localhost:3000/)
                //   "token:a2b2c3" (curl http://token:a2b2c3@localhost:3000/)
                //   ":a2b2c3"
                var parts = /^([^:]*):(.*)$/.exec(id);
                if (parts) {
                    id = parts[2].length > parts[1].length ? parts[2] : parts[1];
                }
            }
            return id;
        }
    }

    if (req.signedCookies) {
        for (i = 0, length = cookies.length; i < length; i++) {
            id = req.signedCookies[cookies[i]];

            if (typeof id === 'string') {
                return id;
            }
        }
    }
    return null;
}