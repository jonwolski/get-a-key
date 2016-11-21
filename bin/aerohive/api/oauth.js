var https = require('https');

module.exports.getPermanentToken = function (code, devAccount, callback) {
    var options = {
        host: 'cloud.aerohive.com',
        port: 443,
        path: '/services/oauth2/token?' +
        'grant_type=authorization_code' +
        '&code=' + code +
        '&redirect_uri=' + devAccount.redirectUrl +
        '&client_id=' + devAccount.clientID +
        '&client_secret=' + devAccount.clientSecret,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    console.log(options);
    var req = https.request(options, function (res) {
        console.info('STATUS: ' + res.statusCode);
        console.info('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (data) {
            console.log(data);
            callback(JSON.parse(data));
        });
    });

    req.on('error', function (err) {
        console.log(err);
        callback(err);
    });

    // write data to request body
    req.write('data\n');
    req.write('data\n');
    req.end();
};

