var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();


//===============MONGODB=================
var mongoose = require('mongoose');
var mongoConfig = require('./config').mongoConfig;
global.db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    // Create your schemas and models here.
  
var init = require("./bin/init");
init();
});

mongoose.connect('mongodb://'+ mongoConfig.host +'/' + mongoConfig.base);


//===============PASSPORT=================
global.passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());


//===============APP=================
app.use(bodyParser.urlencoded({ extended: true , limit: '1mb'}));
app.use(bodyParser.json({limit: '1mb'}));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components',  express.static('../bower_components'));


//===============ROUTES=================

//Customization
var custom = require('./routes/custom');
app.use('/custom/', custom);
//Azure AD
var azure = require('./routes/azure');
app.use('/azure/', azure);
//ADFS
var adfs = require('./routes/adfs');
app.use('/adfs/', adfs);
//Get a Key
var webApp = require('./routes/web-app');
app.use('/web-app/', webApp);
//API
var api = require('./routes/api');
app.use('/api/', api);
//Admin
var admin = require('./routes/admin');
app.use('/admin/', admin);
// Login and Logout 
var login = require('./routes/login');
app.use('/', login);
//Otherwise
app.get("*", function (req, res) {
  res.redirect("/web-app/");
})
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});



module.exports = app;
