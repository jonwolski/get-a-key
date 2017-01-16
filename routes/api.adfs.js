var express = require('express');
var router = express.Router();

var serverHostname = require("../config.js").appServer.vhost;

var Account = require("../bin/models/account");
var Adfs = require("../bin/models/adfs");

function saveAdfs(req, res) {
    Account
        .findById(req.session.account._id)
        .exec(function (err, account) {
            if (err) res.status(500).json({ error: err });
            else if (account) {
                if (account.adfs) {
                    Adfs.update({ _id: account.adfs }, req.body.config, function (err, result) {
                        if (err) res.status(500).json({ error: err });
                        else res.status(200).json({ action: "save", status: 'done' });
                    })
                } else Adfs(req.body.config).save(function (err, result) {
                    if (err) res.status(500).json({ error: err });
                    else {
                        account.adfs = result;
                        account.azure = null;
                        account.save(function (err, result) {
                            if (err) res.status(500).json({ error: err });
                            else res.status(200).json({ action: "save", status: 'done' });
                        })
                    }
                });
                /*if (account.adfs) Azure.findByIdAndRemove(account.azure, function (err) {
                    console.log("azure removed");
                })*/
            } else res.status(500).json({ error: "not able to retrieve the account" });
        });
}


router.get("/", function (req, res, next) {
    if (req.session.xapi) {
        Account
            .findById(req.session.account._id)
            .populate("adfs")
            .exec(function (err, account) {
                if (err) res.status(500).json({ error: err });
                else if (account)
                    res.status(200).json({
                        signin: "https://" + serverHostname + "/login/" + account._id + "/",
                        callback: "https://" + serverHostname + "/adfs/" + account._id + "/callback",
                        logout: "https://" + serverHostname + "/login/" + account._id + "/",
                        adfs: account.adfs
                    });
                else res.status(500).json({ err: "not able to retrieve the account" });
            })
    } else res.status(403).send('Unknown session');
})

router.post("/", function (req, res, next) {
    if (req.session.xapi) {
        if (req.body.config) saveAdfs(req, res);
        else res.status(500).send({ error: "missing adfs" });
    } else res.status(403).send('Unknown session');
})

module.exports = router;