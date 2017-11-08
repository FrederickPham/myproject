module.exports = urlNotFound;


function urlNotFound() {
    return function raiseUrlNotFoundError(req, res, next) {

        console.log('route', req.method);

        var error = new Error(req.method + ' ' + req.url + ' ' + 'does not exist');
        error.status = 404;

        next(error);
    };
};