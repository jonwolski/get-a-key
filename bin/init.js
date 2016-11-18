var fs = require('fs');
var exec = require('child_process').exec;


var vhost = require("../config").appServer.vhost;

module.exports = function () {
    var files = [
        "../certs/" + vhost + ".cert",
        "../certs/" + vhost + ".key",
        "../certs/" + vhost + ".xml"
    ];
    done = 0;
    var error;
    var cmd = 'cd ../certs && pwd && ./generate_app_certificate.sh ' + vhost + ' https://' + vhost + '/adfs/';

    for (var i = 0; i < files.length; i++)
        fs.access(files[i], fs.F_OK, function (err) {
            done++;
            if (err) error = err;
            if (done == files.length)
                if (!error) console.log("ADFS Ceritificates for " + vhost + " present.");
                else {
                    exec(cmd, function (error, stdout, stderr) {
                        if (error) console.log(error);
                        else console.log("ADFS Certificates created for " + vhost);
                    });
                }
        });
}

