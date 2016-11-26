var path = require('path');
var config = require(path.join(__dirname, '../', 'config.json'));
var nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport
var smtpConfig = {
    host: config.mail.host,
    port: config.mail.port,
    secure: false,
    requireTLS: true,
    auth: {
        user: config.mail.username,
        pass: config.mail.apikey
    }
};
var transporter = nodemailer.createTransport(smtpConfig);

transporter.verify(function(error, success) {
    if (error) {
        require(path.join(__dirname, '/logger.js'))().log('error', JSON.stringify(error));
    }
});

exports.send = function(to, cc, bcc, subject, body, callback) {
    if (!to || !subject || !body) {
        if (typeof callback === 'function') return callback('to , subject, body are required', null);
    } else {
        var mailOptions = {
            from: config.mail.from,
            to: to,
            subject: subject,
            html: body
        };
        if (cc) {
            mailOptions.cc = cc;
        }
        if (bcc) {
            mailOptions.bcc = bcc;
        }

        transporter.sendMail(mailOptions, function(error, result) {
            if (error) {
                require(path.join(__dirname, '/logger.js'))().log('error', JSON.stringify(error));
                if (typeof callback === 'function') return callback(JSON.stringify(error), null);
            } else {
                if (typeof callback === 'function') return callback(null, result);
            }
        });
    }
}
