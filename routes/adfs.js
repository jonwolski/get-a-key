var express = require('express');
var router = express.Router();

var Account = require("../bin/models/account");
var xapi = require('../config.js').aerohiveXapi;
var vhost = require("../config").appServer.vhost;
var SamlStrategy = require('passport-saml').Strategy;
var fs = require('fs');

passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (user, done) {
  done(null, user);
});



function getAccount(req, res, next) {
  Account
    .findById(req.params.account_id)
    .populate("adfs")
    .exec(function (err, result) {
      if (err) res.status(500).json({ error: err });
      else {
        req.account = result;
        passport.use(new SamlStrategy(
          {
            entryPoint: result.adfs.entryPoint,
            issuer: vhost,
            callbackUrl: 'https://'+vhost+'/'+req.params.account_id+'/adfs/postResponse',
            privateCert: fs.readFileSync('../certs/'+vhost+'.key', 'utf-8'),
            cert: fs.readFileSync('../certs/'+vhost+'.cert', 'utf-8'),
            // other authn contexts are available e.g. windows single sign-on
            authnContext: 'http://schemas.microsoft.com/ws/2008/06/identity/authenticationmethod/password',
            // not sure if this is necessary?
            acceptedClockSkewMs: -1,
            identifierFormat: null,
            // this is configured under the Advanced tab in AD FS relying party
            signatureAlgorithm: 'sha256'
          },
          function (profile, done) {
            return done(null,
              {
                upn: profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn'],
                // e.g. if you added a Group claim
                group: profile['http://schemas.xmlsoap.org/claims/Group']
              });
          }
        ));
        next();
      }
    })
}

/* GET login page. */

router.get('/:account_id/login', getAccount,
  passport.authenticate('saml', { failureRedirect: '/', failureFlash: true })
);

/* Handle Login POST */
router.post('/:account_id/postResponse', getAccount,
  passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }),
  function (req, res) {
    req.session.xapi = xapi;
    req.session.email = req.session.passport.user.upn;
    res.redirect('/web-app/');
  }
);

/* Handle Logout */
router.get('/logout/', function (req, res) {
  console.log("User " + req.session.passport.user.upn + " is now logged out.");
  req.logout();
  req.session.destroy();
  res.redirect('/login/');
});

router.get("/cert", function (req, res) {
  var vhost = require("../config").appServer.vhost;
  var file = '../certs/' + vhost + ".xml";
  res.download(file);
})

module.exports = router;
