function saveAdfs(req, res) {
    Account
        .find({ ownerId: req.session.xapi.ownerId, vpcUrl: req.session.xapi.vpcUrl, vhmId: req.session.xapi.vhmId })
        .exec(function (err, account) {
            if (err) res.status(500).json({ error: err });
            else if (account.length == 1) {
                if (account[0].azure) Azure.findByIdAndRemove(account[0].azure, function (err) {
                    if (err) res.status(500).json({ error: "not able to save data" });
                    else {
                        account[0].azure = null;
                        account[0].save(function (err, result) {
                            if (err) res.status(500).json({ error: "not able to save data" });
                            else res.status(200).json({ action: "save", status: 'done' });
                        })
                    }
                });
                else res.status(200).json({ action: "save", status: 'done' });
            }
            else res.status(500).json({ error: "not able to retrieve the account" });
        });
}
