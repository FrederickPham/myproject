// Get dependencies
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');


// Get our API
const userApi = require('./api/routes/userCtrl');
const walletApi = require('./api/routes/walletCtrl');


const app = express();

const errorHanler = require('./api/server/middleware/error-handler.js')
const urlNotFound = require('./api/server/middleware/url-notFound')




app.use(function (req, res, next) {
    res.setHeader('accessToken', '*');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
});

// Parsers for POST data
app.use(bodyParser.json({ limit: "50mb" })); // support json encoded bodies
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 })); // support encoded bodies

app.use(cors());

app.use('/api/user', userApi);
app.use('/api/wallet', walletApi);

app.use(urlNotFound());

app.use(errorHanler());



/**
 * Get port from environment and store in Express.
 */
const port = process.env.PORT || '3000';



app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app, (req, res) => res.end('test'));

/**
 * Listen on provided port, on all network interfaces.
 */



server.on('listening', () => console.log('ok, server is running'));



server.listen(port, () => console.log(`API running on localhost:${port}`));



