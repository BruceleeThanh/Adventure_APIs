var path = require('path');
var async = require('async');
var uuid = require('node-uuid');
var fs = require('fs-extra');
var shortid = require('shortid');
var formidable = require('formidable');
var config = require(path.join(__dirname, '../', 'config.json'));
var validator = require(path.join(__dirname, '../', 'ultis/validator.js'));
var authentication = require(path.join(__dirname, '../', 'ultis/authentication.js'));

module.exports = function(app, redisClient) {
    app.post('/api/file/upload_image', function(req, res) {

        var allowed = ['image/png', 'image/jpeg', 'image/jpg'];
        var extensions = {
            'image/png': 'png',
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg'
        };
        var maxSize = 5 * 1024 * 1024;

        var form = new formidable.IncomingForm();
        form.uploadDir = path.join(__dirname, '../', config.upload_path.root + config.upload_path.image + '/');
        form.keepExtensions = true;

        form.on('fileBegin', function(name, file) {
            if (allowed.indexOf(file.type) === -1) {
                return form._error(-1);
            }
            if (file.size > maxSize) {
                return form._error(-2);
            }
        });

        form.on('progress', function(bytesReceived, bytesExpected) {
            if (bytesReceived > maxSize) {
                return form._error(-2);
            }
        });

        form.parse(req, function(error, body, files) {
            if (error) {
                var message = '';
                var code = error;
                if (error === -1) {
                    message = 'File is not image';
                } else if (error === -2) {
                    message = 'File is too large';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message ? message : 'Unknow Error'
                });
            } else {

                var data = {};
                var currentUser = null;
                var fields = [{
                    name: 'token',
                    type: 'string',
                    required: true
                }];

                var timeStamp = new Date().getTime();
                var unixsid = shortid.generate();
                var extension = extensions[files.file.type];
                var filename = null;
                var localUrl = null;
                var serveUrl = null;

                async.series({
                    validate: function(callback) {
                        validator(body, fields, function(error, result) {
                            if (error) {
                                return callback(error, null);
                            } else {
                                data = result;
                                return callback(null, null);
                            }
                        });
                    },
                    getLoggedin: function(callback) {
                        authentication.getLoggedin(redisClient, data.token, function(error, result) {
                            if (error) {
                                return callback(-3, null);
                            } else if (!result) {
                                return callback(-4, null);
                            } else {
                                currentUser = JSON.parse(result);
                                return callback(null, null);
                            }
                        });
                    },
                    saveFile: function(callback) {
                        filename = currentUser._id + '_' + timeStamp + '_' + unixsid + '.' + extension;
                        localUrl = path.join(__dirname, '../', config.upload_path.root + config.upload_path.image + '/' + filename);
                        serveUrl = config.domain + ':' + config.port + config.upload_path.root + config.upload_path.image + '/' + filename;
                        fs.rename(files.file.path, localUrl, function(error) {
                            if (error) {
                                require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                                return callback(JSON.stringify(error), null);
                            }
                            return callback(null, null);
                        });
                    }
                }, function(error, results) {
                    if (error) {
                        fs.unlink(files.file.path);
                        var message = '';
                        var code = error;
                        if (error === -3) {
                            message = 'Redis error';
                        } else if (error === -4) {
                            message = 'Token not found';
                        } else {
                            message = error;
                            code = 0;
                        }
                        res.json({
                            code: code,
                            message: message
                        });
                    } else {
                        res.json({
                            code: 1,
                            data: {
                                link: serveUrl
                            }
                        });
                    }
                });
            }
        });
    });
};
