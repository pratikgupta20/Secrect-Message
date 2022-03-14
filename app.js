const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const app = express();
const saltRounds = 10;


require("dotenv").config();

////////////////////////////connecting mongoDB dataBase//////////////////////////////////////
mongoose.connect("mongodb://localhost:27017/userDB");

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

//////////////////////////creating a userSchema///////////////////////////////////////////////////
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


///////////////////////////creating a model based on userSchema//////////////////////////////////////
const User = new mongoose.model("User", userSchema);

//////////////////////to render all routes///////////////////////////////////////////////
app.get("/", (req, res) => {
    res.render("home.ejs")
});
app.get("/login", (req, res) => {
    res.render("login.ejs")
});
app.get("/register", (req, res) => {
    res.render("register.ejs")
});
////////////////////////to register a new user in dataBase
app.post("/register", (req, res) => {

    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        const newUser = new User({
            email: req.body.username,
            password: hash
        });
        newUser.save(function (err) {
            if (!err) {
                res.render("secrets.ejs");
            } else {
                console.log(err);
            }
        });
    });


});
app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({ email: username }, (err, foundUser) => {
        if (err) {
            res.send("u r not authorized user");
        } else {
            if (foundUser) {
                bcrypt.compare(password, foundUser.password, function (err, result) {
                    if (result == true) {
                        res.render("secrets.ejs");
                    }
                })
            }
        }
    });
});


/////////////////////server start function///////////////////////////////////////////
app.listen(3000, function () {
    console.log("server starterd on port 3000");
})