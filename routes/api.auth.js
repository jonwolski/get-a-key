var express = require('express');
var router = express.Router();

var serverHostname = require("../config.js").appServer.vhost;

var Account = require("../bin/models/account");
var Azure = require("../bin/models/azure");
var Adfs = require("../bin/models/adfs");

var fs = require('fs');
var exec = require('child_process').exec;


function genCertificate(account_id) {
    var files = [
        "../certs/" + account_id + "." + serverHostname + ".cert",
        "../certs/" + account_id + "." + serverHostname + ".key",
        "../certs/" + account_id + "." + serverHostname + ".xml"
    ];
    done = 0;
    var error;
    var cmd = 'cd ../certs && pwd && ./generate_app_certificate.sh ' +
        account_id + "." + serverHostname + ' https://' + serverHostname + "/adfs/" + account_id + '/';

    for (var i = 0; i < files.length; i++)
        fs.access(files[i], fs.F_OK, function (err) {
            done++;
            if (err) error = err;
            if (done == files.length)
                if (!error) console.log("ADFS Ceritificates for " + serverHostname + "/" + account_id + " present.");
                else {
                    exec(cmd, function (error, stdout, stderr) {
                        if (error) console.log(error);
                        else {
                            console.log("ADFS Certificates created for " + serverHostname + "/" + account_id);
                            i = files.length;
                        }
                    });
                }
        });
}

router.get("/", function (req, res, next) {
    genCertificate(req.session.account._id);
    if (req.session.xapi) {
        Account
            .findById(req.session.account._id)
            .populate("azure")
            .populate("adfs")
            .exec(function (err, account) {
                if (err) res.status(500).json({ error: err });
                else if (account)
                    res.status(200).json({
                        method: account.method,
                        azure: account.azure,
                        adfs: account.adfs,
                        signin: "https://" + serverHostname + "/login/" + account._id + "/",
                        callback: "https://" + serverHostname + "/azure/" + account._id + "/callback",
                        logout: "https://" + serverHostname + "/login/" + account._id + "/",
                    });
                else res.status(200).json();
            })
    } else res.status(403).send('Unknown session');
})

router.get("/cert", function (req, res) {
    var vhost = require("../config").appServer.vhost;
    var file = '../certs/' + vhost + "_" + req.session.account._id + ".xml";
    res.download(file);
})

function saveAzure(req, res) {
    Account
        .findById(req.session.account._id)
        .exec(function (err, account) {
            if (err) res.status(500).json({ error: err });
            else if (account) {
                account.method = "azure";
                account.save(function (err, result) {
                    if (account.azure) {
                        Azure.update({ _id: account.azure }, req.body.config, function (err, result) {
                            if (err) res.status(500).json({ error: err });
                            else res.status(200).json({ action: "save", status: 'done' });
                        })
                    } else Azure(req.body.config).save(function (err, result) {
                        if (err) res.status(500).json({ error: err });
                        else {
                            account.azure = result;
                            account.save(function (err, result) {
                                if (err) res.status(500).json({ error: err });
                                else res.status(200).json({ action: "save", status: 'done' });
                            })
                        }
                    });
                })
            } else res.status(500).json({ error: "not able to retrieve the account" });
        });
}


router.post("/azure", function (req, res, next) {
    if (req.session.xapi) {
        if (req.body.config) saveAzure(req, res);
        else res.status(500).send({ error: "missing azure" });
    } else res.status(403).send('Unknown session');
})



function saveAdfs(req, res) {
    Account
        .findById(req.session.account._id)
        .exec(function (err, account) {
            if (err) res.status(500).json({ error: err });
            else if (account) {
                account.method = "adfs";
                account.save(function (err, result) {
                    if (account.adfs) {
                        Adfs.update({ _id: account.adfs }, req.body.config, function (err, result) {
                            if (err) res.status(500).json({ error: err });
                            else res.status(200).json({ action: "save", status: 'done' });
                        })
                    } else Adfs(req.body.config).save(function (err, result) {
                        if (err) res.status(500).json({ error: err });
                        else {
                            account.adfs = result;
                            account.save(function (err, result) {
                                if (err) res.status(500).json({ error: err });
                                else res.status(200).json({ action: "save", status: 'done' });
                            })
                        }
                    });
                })
            } else res.status(500).json({ error: "not able to retrieve the account" });
        });
}

router.post("/adfs", function (req, res, next) {
    if (req.session.xapi) {
        if (req.body.config) saveAdfs(req, res);
        else res.status(500).send({ error: "missing adfs" });
    } else res.status(403).send('Unknown session');
})

module.exports = router;