var path = require('path');
var config = require(path.join(__dirname, '../', 'config.json'));
var request = require('request');
var async = require('async');


const app_name = config.insider.app_name;
const api_key = config.insider.api_key;

exports.pushNotification = function (data, callback) {
    console.log('please implement method pushNotification...');
};

// exports.request = function (data, callback) {
//     async.each(data.identifier, function (item, callback) {
//         var sendData = {
//             app_name: app_name,
//             api_key: api_key,
//             send_at: data.date,
//             identifier: item,
//             notification: {
//                 alert: data.message
//             }
//         };
//         console.log(JSON.stringify(sendData));
//         request.post({
//             url: 'http://mobile.useinsider.com/interaction/insider_server_connection',
//             json: sendData
//         }, function optionalCallback(err, httpResponse, body) {
//             if (err) {
//                 return console.error('request failed:', err);
//             }
//             console.log('Request successful!  Server responded with:', body);
//         });
//     }, function (error) {
//         if (error) {
//             return callback(-12, null);
//         }
//         else {
//             return callback(null, null);
//         }
//     });
//
// };

