var express = require('express');
var router = express.Router();

var serverHostname = require("../config.js").appServer.vhost;

var Account = require("../bin/models/account");
var Azure = require("../bin/models/azure");


function saveAzure(req, res) {
    Account
        .findById(req.session.account._id)
        .exec(function (err, account) {
            if (err) res.status(500).json({ error: err });
            else if (account) {
                if (account.azure) {
                    Azure.update({ _id: account.azure }, req.body.config, function (err, result) {
                        if (err) res.status(500).json({ error: err });
                        else res.status(200).json({ action: "save", status: 'done' });
                    })
                } else Azure(req.body.config).save(function (err, result) {
                    if (err) res.status(500).json({ error: err });
                    else {
                        account.azure = result;
                        account.adfs = null;
                        account.save(function (err, result) {
                            if (err) res.status(500).json({ error: err });
                            else res.status(200).json({ action: "save", status: 'done' });
                        })
                    }
                });
                /*if (account.adfs) Adfs.findByIdAndRemove(account.adfs, function (err) {
                    console.log("adfs removed");
                })*/
            } else res.status(500).json({ error: "not able to retrieve the account" });
        });
}


router.get("/", function (req, res, next) {
    if (req.session.xapi) {
        Account
            .findById(req.session.account._id)
            .populate("azure")
            .exec(function (err, account) {
                if (err) res.status(500).json({ error: err });
                else if (account)
                    res.status(200).json({
                        signin: "https://" + serverHostname + "/login/" + account._id + "/",
                        callback: "https://" + serverHostname + "/azure/" + account._id + "/callback",
                        logout: "https://" + serverHostname + "/login/" + account._id + "/",
                        azure: account.azure
                    });
                else res.status(500).json({ err: "not able to retrieve the account" });
            })
    } else res.status(403).send('Unknown session');
})

router.post("/", function (req, res, next) {
    if (req.session.xapi) {
        if (req.body.config) saveAzure(req, res);
        else res.status(500).send({ error: "missing azure" });
    } else res.status(403).send('Unknown session');
})

module.exports = router;