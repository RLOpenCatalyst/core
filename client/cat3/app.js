var express=require('express'),
http = require('http'),
path = require('path'),
cookieParser = require('cookie-parser'),
bodyParser = require('body-parser');
var app=express();

app.use(require('serve-static')(path.join(__dirname, 'public')));
app.use(require('method-override')());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.server = http.createServer(app);

//listen up
app.server.listen(3000, function() {
	//and... we're live
	var host = app.server.address().address;
	var port = app.server.address().port;
});
