const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

require("dotenv").config();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: "this is our little secret",
    resave: false,
    saveUninitialized: false

}));

app.use(passport.initialize());
app.use(passport.session());

////////////////////////////connecting mongoDB dataBase//////////////////////////////////////

mongoose.connect("mongodb://localhost:27017/userDB");

//////////////////////////creating a userSchema///////////////////////////////////////////////////
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
///////////////////////////creating a model based on userSchema//////////////////////////////////////
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
    // where is this user.id going? Are we supposed to access this anywhere?
});

// used to deserialize the user
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://localhost:3000/auth/google/secrets",
    // userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

//////////////////////to render all routes///////////////////////////////////////////////
app.get("/", (req, res) => {
    res.render("home.ejs")
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

app.get("/login", (req, res) => {
    res.render("login.ejs")
});
app.get("/register", (req, res) => {
    res.render("register.ejs")
});
app.get("/secrets", function (req, res) {
    User.find({ "secret": { $ne: null } }, function (err, foundUsers) {
        if (err) {
            console.log(err0);
        } else {
            if (foundUsers) {
                res.render("secrets", { usersWithSecrets: foundUsers })
            }
        }
    })
});
app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("login")
    }
});
app.post("/post", (req, res) => {
    const submittedSecret = req.body.secret;
    User.findById(req.user.id, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            foundUser.secret = submittedSecret;
            foundUser.save(function () {
                res.redirect("/secrets");
            });
        }
    });
});

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});
////////////////////////to register a new user in dataBase
app.post("/register", function (req, res) {

    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        }
        else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            })
        }
    })

});
app.post("/login", (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });
});


/////////////////////server start function///////////////////////////////////////////
app.listen(3000, function () {
    console.log("server starterd on port 3000");
})