/**
 * Created by Brucelee Thanh on 24/12/2016.
 */

var request = require('request');

module.exports.sendMessageToUser = function (deviceId, message) {
    message = message.split("<b>");
    var API_KEY = "AAAA87u15ZU:APA91bGk5yPTwQRI12u5xo8mzOcMWGFe5VdM6aphKoe5J8q5LLOR3hYmdNj_3jOfGJJyVpsxDIKEmNX05pUkfLI1zowSRb0ukUU_8oOUAjC--BAuZfQvlizgY-DwVqNjQXYwh2RgF6rDktxoOhOn33ot8EiYBCvn4Q";
    request({
        url: 'https://fcm.googleapis.com/fcm/send',
        method: 'POST',
        headers: {
            'Content-Type' : 'application/json',
            'Authorization': 'key='+API_KEY
        },
        body: JSON.stringify(
            {
                data: {
                    message: message
                },
                to: deviceId
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
            console.log('Done!');
            console.log(response);
            console.log(body);
        }
    });
}