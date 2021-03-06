//jshint esversion:6
require('dotenv').config(); //Use to store secret keys and APIs
//When uploading to github use git-ignore to avoid uploading the .env file

const express=require('express');
const bodyParser=require('body-parser');
const ejs=require('ejs');
const mongoose=require('mongoose');
// const encrypt=require('mongoose-encryption'); //Level 2
// const md5=require('md5'); level-03
const session=require('express-session');
const passport=require('passport');
const passportLocalMongoose=require('passport-local-mongoose');
// const passport = require('passport');

//level-06
const GoogleStrategy = require('passport-google-oauth20').Strategy; 
const findOrCreate=require('mongoose-findorcreate');






/*//level-04
const bcrypt=require('bcrypt');
const saltRounds=10;
*/

const app=express();


app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set('view engine','ejs');

//above connect and below app.use
app.use(session({
    
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect('mongodb://localhost:27017/userDB',{useNewUrlParser:true});

const userSchema= new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
});

userSchema.plugin(passportLocalMongoose); //LEVEL-05
userSchema.plugin(findOrCreate);
/*
//Level-02

const secret=process.env.SECRET;
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password']});
//It will encrypt when u call save and will dcrypt when u call find
*/

const User=new mongoose.model("User",userSchema);

/*level-05*/
passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser()); //Stuffs the cookie
// passport.deserializeUser(User.deserializeUser()); //breaks the cookie to get info

//level-06
/*for all serialize*/

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
  
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('/',function(req,res){
    res.render('home');
});


app.get('/login',function(req,res){
    res.render('login');
});

app.get('/register',function(req,res){
    res.render('register');
});

app.get('/submit',function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect('/login');
    }
});

app.post('/submit',function(req,res){
    const newsecret=req.body.secret;
    // console.log(newsecret);

    User.findById(req.user.id,function(err,foundUser){
        if(err) {
            console.log(err);
        }else{
            if(foundUser){
                foundUser.secret=newsecret;
                foundUser.save(function(){
                    res.redirect('/secrets');
                });
            }
        }
    });
});

//level-06
app.get('/auth/google',
    passport.authenticate('google',{scope:["profile"]})
);

//get request made by google
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });
/********************LEVEL-01 Authentication**********************/
/*
app.post('/register',function(req,res){
    const newUser=new User({
        email:req.body.username,
        password:req.body.password
    });

    newUser.save(function(err){
        if(err){
            console.log(err);
        }else{
            res.render("secrets");
        }
    });
});

app.post('/login',function(req,res){

    const username=req.body.username;
    const password=req.body.password;

    User.findOne(
        {email:username},
        function(err,foundUser){
            if(!err){
                if(foundUser.password===password){
                    res.render('secrets');
                }else{
                    console.log("User Not found");
                }
            }else{
                console.log(err);
            }
        }
    )
});  */

/****************LEVEL-02 Authentication(Encryption)***********************/
/*
app.post('/register',function(req,res){
    const newUser=new User({
        email:req.body.username,
        password:req.body.password
    });

    newUser.save(function(err){
        if(err){
            console.log(err);
        }else{
            res.render("secrets");
        }
    });
});

app.post('/login',function(req,res){

    const username=req.body.username;
    const password=req.body.password;

    User.findOne(
        {email:username},
        function(err,foundUser){
            if(!err){
                if(foundUser.password===password){
                    res.render('secrets');
                }else{
                    console.log("User Not found");
                }
            }else{
                console.log(err);
            }
        }
    )
});
*/

/****************LEVEL-03 Authentication(Hashing -Cannot revert) */

/*
app.post('/register',function(req,res){
    const newUser=new User({
        email:req.body.username,
        password:md5(req.body.password)
    });

    newUser.save(function(err){
        if(err){
            console.log(err);
        }else{
            res.render("secrets");
        }
    });
});

app.post('/login',function(req,res){

    const username=req.body.username;
    const password=md5(req.body.password);

    User.findOne(
        {email:username},
        function(err,foundUser){
            if(!err){
                if(foundUser.password===password){
                    res.render('secrets');
                }else{
                    console.log("User Not found");
                }
            }else{
                console.log(err);
            }
        }
    )
});
*/

/****************LEVEL-04 Authentication(Salting -bcrypt)***************/

/*
app.post('/register',function(req,res){

    bcrypt.hash(req.body.password,10,function(err,hash){
        if(err){
            console.log(err);
        }else{
            const newUser=new User({
                email:req.body.username,
                password:hash
            });
        
            
            newUser.save(function(err){
                if(err){
                    console.log(err);
                }else{
                    res.render("secrets");
                }
            });
        }
    });

});

app.post('/login',function(req,res){

    const username=req.body.username;
    const password=req.body.password;


    User.findOne(
        {email:username},
        function(err,foundUser){
            if(err){
                console.log(err);
            }else{
                if(foundUser){
                    bcrypt.compare(password,foundUser.password,function(err,result){
                        if(result===true){
                            res.render('secrets');
                        }    
                    })
                }
            }
        }
    )
}); */

/***********************LEVEL-05 Passport(local)***************/

app.get('/secrets',function(req,res){
    // if(req.isAuthenticated()){
    //     res.render("secrets");
    // }else{
    //     res.redirect('/login');
    // }
    User.find({"secret":{$ne:null}},function(err,foundUsers){
        if(err){
            console.log(err);
        }else{
            if(foundUsers){
                res.render("secrets",{userWithSecrets:foundUsers})
            }
        }
    })
});
app.post('/register',function(req,res){

    //all hash and sal will be donw by passport-local-mongoose
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect('/register');
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect('/secrets');
            });
        }
    });
});

app.post('/login',function(req,res){

    const user=new User({
        username:req.body.username,
        password:req.body.password
    });

    //login() comes from passport
    req.login(user,function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect('/secrets');
            });
        }
    });

});

app.get('/logout',function(req,res){
    req.logout();
    res.redirect('/');
})


/**************LEVEL-06 OAuth Google*****************/


app.listen(3000,function(){
    console.log("Server is running at port 3000");
})
