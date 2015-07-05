/* Swaniti_app
 * Simple Login Registration Node.js App
 * This app use Express, Mongoose, Nodemailer and MongoDB database.
 *
 */
var mailer = require("nodemailer");
var express = require("express"),
    engines = require('consolidate'),
    app = express(),
    mongoose = require('mongoose'),
    dbmessage = '',
    apptitle = 'Swaniti_App',
    MemoryStore = require('express').session.MemoryStore,

/*
 * UserSchema
 *
 */
UserSchema = new mongoose.Schema({
    username:'string',
    password:'string',
    email:'string',
	time : 'string'
});

app.configure(function () {
    app.use(express.logger());
    app.use(express.bodyParser());
    app.use(express.methodOverride());

    app.use(express.cookieParser());
    app.use(express.session(
        {secret:"secret key", store:new MemoryStore()}));
    app.use(express.static(__dirname + '/app'));

    app.engine('html', engines.underscore);

    
    app.set('views', __dirname + '/app/views');
    app.set('view engine', 'html');
    app.set('PORT', 3000);

    // MongoDB 
    app.set('MONGODB_DEV', 'mongodb://localhost/27017');

    if ('development' == app.get('env')) {
        app.set('MONGODB_CONN', app.get('MONGODB_DEV'));
    }

    

});

/* 
 * MongoDB connection using Mongoose
 */

var db = mongoose.createConnection(app.get('MONGODB_CONN')),
    User = db.model('users', UserSchema);

db.on('connected', function () {
    console.log('Applications connect to the MongoDB database .');
    dbmessage = 'Applications connect to the MongoDB database .';
});

db.on('error', function () {
    console.error.bind(console, 'Connection error!');
    dbmessage = 'Connection to MongoDB error!';
});

app.get("/", function (req, res) {
    res.render('index', {
        title:apptitle,
        message:''
    });
});

// REGISTRATION
app.get('/user/registration', function (req, res) {
    res.render("user/registration", {title:apptitle});
});

// AUTHENTICATION
app.post('/user/login', function (req, res) 
{

    User.find({username:req.body.username, password:req.body.password}, function (err, user) {
		

			
        if (user.length > 0) 
		{	
            console.log('User Data:\n');
            console.log(user);

            req.session.loggedIn = true;
			if (user[0].username === 'admin')
			{
				/*db.open(function(err, db) 
				{
					if (!err) 
					{
						db.collection('users', function(err, collection) 
						{
						if (!err) 
						{*/
							User.find({},(function (err, dataObjArr) 
							{
								//if(!err)
								//{
									//db.close();
								
							console.log(dataObjArr);
							var data = '';
							var dataArr = [];
							var i = dataObjArr.length;
							//check for error
							if(err){return res.end('error!'+err);}
							//Data
							if (dataObjArr)
							{
								while(i--)
								{
								dataArr[i] = "<tr>"+"<td>"+dataObjArr[i].username+"</td>"+"<td>"+dataObjArr[i].password+"</td>"+"<td>"+dataObjArr[i].email+"</td>"+"</tr>";
								
								}
								
								data = "<table border=1>"+dataArr.join(' ')+"</table>";
								res.render('admin/home', { returnedData : data , title:apptitle});
							}
							else
							{
								res.end();
							}
								//}
							}) ); 
										
						//}
						//});	
					//}	
				//});			
			}
				
				
			else	
            {
				res.render('user/home', 
				{
					user:user[0],
					title:apptitle
				});
			}
		}
			
         else {
            console.log('ERROR: Wrong Username or Password');
            res.render('index', {
                title:apptitle,
                message:'<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button><h4>Error!</h4>Wrong username or password</div>'
            });
        }
    
});
});
app.param('name', function (req, res, next, name) {
    User.find({username:name}, function (err, user) {
        req.user = user[0];
        console.log(user);
        next();
    });
})

app.get("/user/:name", function (req, res) {
    if (req.session.loggedIn) {
        res.render('user/home', {
            user:req.user,
            title: apptitle
        });
    } else {
        res.render('index', {
            title:apptitle,
            message:''
        });
    }
})

// CREATE USER
app.post("/user/create", function (req, res) {

    var user = new User({
        username:req.body.username,
        password:req.body.password,
        email:req.body.email,
		time:(new Date).getTime()
		
    });
		//req.body.email.replace(
			//new RegExp( "^(.+)@(.+)\\.(\\w+)$" , "i"),
			
    user.save(function (err, user) {
        if (err) res.json(err)
        //res.end('Registration '+user.username +' Ok!');
        req.session.loggedIn = true;
		var smtpTransport = mailer.createTransport({
			service: "Gmail",
			auth: {
				user: "abhimanyutest@gmail.com",
				pass: "testabhimanyu"
			}
		});
			
		var mail = {
			from: "New Login App <abc@xyz.com>",
			to: req.body.email,
			subject: "Send Email Using Node.js",
			text: "Thanks for registering with us ",
			html: "<b>Thanks for registering with us</b>"
		};

		smtpTransport.sendMail(mail, function(error, response){
			if(error){
				console.log(error);
			}else{
				console.log("Message sent: " + response.message);
			}
    
			smtpTransport.close();
		});
        res.redirect('/user/' + user.username);
    });
});


// LOGOUT
app.get('/logout', function (req, res)
 {
    // clear user session
    req.session.loggedIn = false;
    res.render('index',{
        title:apptitle,
        message:''});
});

app.listen(app.get('PORT'));
console.log('Node-Express-MongoDB Login Registration App');
console.log('-------------------------------------------');
console.log("Server Port: " + app.get('PORT'));
