//
//
//  Aquathlon System (aqsys) アプリケーションサーバ用メインプログラム
//
//

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var cons = require('consolidate');
var app = express();
var favicon = require('serve-favicon');

var cookieParser = require('cookie-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongo = require('mongodb');
var mongoose = require('mongoose');

console.log('here1');


// include user unctions
//var entry = require('./entry');

console.log('here2');
//
//var mongoUri='mongodb://localhost/loginapp';

const environment = process.env.NODE_ENV || 'development';
const config = require('./mongoconfig');
console.log("environment:" +environment);
console.log("config:" +config);

var mongoUri=config[environment].connection;
console.log("mongoUri:"+mongoUri);

mongoose.connect(mongoUri).then(function(){
  console.log("mongoDB connected");
}).catch(function(err){
  console.log("mongoDB connection error:"+err);
});

var loginappdb = mongoose.connection;

console.log('here3');

// View Engine

app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');

console.log('here4');

// Set Public Folder
app.use(express.static(path.join(__dirname, 'public')));

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(cookieParser());

console.log('here5');


// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

// Express Session
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

// Passport init
app.use(passport.initialize());
app.use(passport.session());

// Express Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.'),
          root    = namespace.shift(),
          formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

var dbRecord = require('./db/record');
var dbEntry = require('./db/entry');
var dbWaves = require('./db/waves');

var routes = require('./routes/index');
var users  = require('./routes/users');
var entry  = require('./routes/entry');
var waves = require('./routes/waves');
var record = require('./routes/record');
var punch  = require('./routes/record/punch');
var numbercards  = require('./routes/numbercards');
var prize  = require('./routes/prize');
var entrylist = require('./api/entry');
var recordlist = require('./api/record');
var waveslist = require('./api/waves');
//var printcard = require('./api/printcard');

app.use(flash());


// Connect Flash

// Global Vars
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = (req.user && req.user.username) || null;
  res.locals.schemaname = (req.user && req.user.schemaname) || null;
  res.locals.basedate = (req.user && req.user.basedate) || "2017/12/31";
  res.locals.numbercardheader = (req.user && req.user.numbercardheader) || "";
  res.locals.numbercardfooter = (req.user && req.user.numbercardfooter) || "";
  res.locals.useradmin = (req.user && (req.user.username=="aqsysadmin"));
  console.log("setConfig begin");
  var config={
    schemaname: res.locals.schemaname,
    basedate: res.locals.basedate,
    numbercardheader: res.locals.numbercardheader,
    numbercardfooter: res.locals.numbercardfooter
  };
  dbRecord.setConfig(config);
  dbEntry.setConfig(config);
  dbWaves.setConfig(config);
  numbercards.setConfig(config);

  console.log("config.schemaname:"+config.schemaname);
  console.log("config.numbercardheader:"+config.numbercardheader);
  console.log("setConfig end");
  next();
});

app.use('/', routes);
app.use('/users', users);
app.use('/entry', entry);
app.use('/waves', waves);
app.use('/record', record);
app.use('/record/punch', punch);
app.use('/numbercards', numbercards);
app.use('/prize', prize);
app.use('/api/entry', entrylist);
app.use('/api/record', recordlist);
app.use('/api/waves', waveslist);
//app.use('/api/printcard', printcard);

//app.listen(process.env.PORT || 3000, function(){
//  console.log("Express server listening on port %d in %s mode", //this.address().port, app.settings.env);
//});

console.log('mod_socket end');


var PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = app
//    .use((req, res) => res.sendFile(INDEX) )
    .listen(PORT, () => console.log(`Listening on ${ PORT }`));


const SocketServer = require('ws').Server;
const wss = new SocketServer({ server });

const url = require('url');
//接続確立時の処理

wss.on('connection', (ws, req) => {
  ws.onmessage = function (event) {
    console.log("message");
    var data=JSON.parse(event.data);
    if(data.type=="punchConnect") {
      ws.tnum = data.tnum ;
    }else if(data.type=="punch") {
      wss.clients.forEach((client) => {
        if(client.tnum==data.tnum) {
          client.send(JSON.stringify(data));
        }
      });
    }else if(data.type=="punchBreath") {
      ws.send(JSON.stringify(data));
    }
    console.log("end");
  };

  // 切断したときに送信
  ws.on('close', () => console.log('Client disconnected'));
});

console.log('mod_socket end');
console.log('here7');
