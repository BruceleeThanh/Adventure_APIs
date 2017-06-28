/**
 * Created by Brucelee Thanh on 28/10/2016.
 */
// set up express
var express = require('express');
var app = express();
var path = require('path');
var config = require(path.join(__dirname, '/config.json'));
var server = require('http').createServer(app);
var io = require('socket.io')(server);

//allow cross origin
app.use(require('cors')());

//set up body parser used for reading post request json object
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

//set up morgan
var morgan = require('morgan');
app.use(morgan('dev'));

// setup redis
var redisClient = require("redis").createClient();
redisClient.on("error", function(error) {
    require(path.join(__dirname, 'ultis/logger.js'))().log('error', JSON.stringify(error));
});

//setup swagger
app.use(express.static(path.join(__dirname, '/swagger')));

//serve image
app.use(config.upload_path.root, express.static(path.join(__dirname, config.upload_path.root)));

//connect mongodb
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(config.mongodb_url);
mongoose.connection.on('error', function() {
    require(path.join(__dirname, 'ultis/logger.js'))().log('error', 'MongoDb connection error');
});
mongoose.connection.once('open', function() {
    // we're connected!
});

//set up apis
require(path.join(__dirname, '/routes'))(app, redisClient);

//background jobs
// require(path.join(__dirname, '/cores/background.js'))();

//server start
server.listen(config.port);
console.log('Server start on port: ' + config.port);

require(path.join(__dirname, '/routes/socket.js'))(io, redisClient);