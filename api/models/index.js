
'use strict';


var db = {};
var fs = require('fs');
var path = require('path');
var mongoose = require('mongoose');
var basename = path.basename(module.filename);
var env = process.env.NODE_ENV || 'development';
var config = require('../server/config.json')[env];




//+ config.username + ":" + config.password + "@"
var connectionString = `mongodb://` + config.host + ":" + config.port + "/" + config.database;

db.mongoose = mongoose;


db.connectionString = connectionString;

//mPromise mongoose exec .then
mongoose.Promise = require('bluebird');

mongoose.connect(db.connectionString, { useMongoClient: true });

fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        var model = require('./' + file);
        db[file.substr(0, file.indexOf('.'))] = mongoose.model(file.substr(0, file.indexOf('.')), model);;
    });


module.exports = db;
