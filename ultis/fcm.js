/**
 * Created by Brucelee Thanh on 24/12/2016.
 */

var request = require('request');

module.exports.sendMessageToUser = function (deviceId, message) {
    request({
        url: 'https://fcm.googleapis.com/fcm/send',
        method: 'POST',
        headers: {
            'Content-Type': ' application/json',
            'Authorization': 'key=AIzaSyCQxGi3kcIMqjQkSWQak2t9kZOrIP-nsj0'
        },
        body: JSON.stringify(
            {
                "data": {
                    "message": message
                },
                "to": deviceId
            }
        )
    }, function (error, response, body) {
        if (error) {
            console.error(error, response, body);
        }
        else if (response.statusCode >= 400) {
            console.error('HTTP Error: ' + response.statusCode + ' - ' + response.statusMessage + '\n' + body);
        }
        else {
            console.log('Done!')
        }
    });
}