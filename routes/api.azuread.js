var express = require('express');
var router = express.Router();

var serverHostname = require("../config.js").appServer.vhost;

var Account = require("../bin/models/account");
var Azure = require("../bin/models/azure");


function saveAzure(req, res) {
    Account
        .find({ ownerId: req.session.xapi.ownerId, vpcUrl: req.session.xapi.vpcUrl, vhmId: req.session.xapi.vhmId })
        .exec(function (err, account) {
            if (err) res.status(500).json({ error: err });
            else if (account.length == 1) {
                if (account[0].azure) {
                    Azure.update({ _id: account[0].azure }, req.body.azure, function (err, result) {
                        if (err) res.status(500).json({ error: err });
                        else res.status(200).json({ action: "save", status: 'done' });
                    })
                } else Azure(req.body.azure).save(function (err, result) {
                    if (err) res.status(500).json({ error: err });
                    else {
                        account[0].azure = result;
                        account[0].adfs = null;
                        account[0].save(function (err, result) {
                            if (err) res.status(500).json({ error: err });
                            else res.status(200).json({ action: "save", status: 'done' });
                        })
                    }
                });
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
        if (req.body.azure) saveAzure(req, res);
        else res.status(500).send({ error: "missing azure" });
    } else res.status(403).send('Unknown session');
})

module.exports = router;