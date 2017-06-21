const passport = require("passport");
const crypto = require("crypto") //Crypto is a default package with NodeJs that encrypts strings
const mongoose = require("mongoose")
const User = mongoose.model("User");
const promisify = require("es6-promisify")
const mail = require("../handlers/mail")

exports.login = passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: "Failed Login",
    successRedirect: "/",
    successFlash: "Successfully Logged In!"
});

exports.logout = (req, res) => {
    req.logout();
    req.flash("success", "Successfully Logged Out!");
    res.redirect("/")
}

exports.isLoggedIn = (req, res, next) => {
    //check if user is logged in
    if(req.isAuthenticated()) {
        next();
        return
    } 
    req.flash("error", "You Have To Be Logged In To Do That!");
    res.redirect("/login");
}

exports.forgot = async (req, res) => {
    //check if user exists
    const user = await User.findOne({email: req.body.email});
    if(!user) {
        req.flash("error", "Oops! No Email With That Account Exists.")
        return res.redirect("/login");
    }
    // //set reset tokens and expiry on their account
    // user.resetPasswordToken = crypto.randomBytes(20).toString("hex"); //built in crypto
    // user.resetPasswordExpires = Date.now() + 3600000; //1 hour from now
    // await user.save();
    // //send them an email with the token using nodemailer
    // const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
    // await mail.send({
    //     user: user, 
    //     subject: "Password Reset",
    //     resetURL: resetURL,
    //     filename: "password-reset"
    // })
    
    req.flash("success", `Sorry! This is just for demo purposes. I have yet to set up a email service like Postmark.`);
    //redirect to login page
    res.redirect("/login")
}

exports.reset = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {$gt: Date.now()} //Greater than now
    })
    if(!user){
        req.flash("error", "Password Reset Is Invalid Or Has Expired");
        return res.redirect("/login")
    }
    res.render("reset", {title: "Reset Your Password"})
}

exports.confirmedPasswords = (req, res, next) => {
    if(req.body.password === req.body["password-confirm"]){
        next()
        return;
    }
    req.flash("error", "Passwords Do Not Match");
    res.redirect("back")
}

exports.update = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {$gt: Date.now()} //Greater than now
    });

    if(!user){
        req.flash("error", "Password Reset Is Invalid Or Has Expired");
        return res.redirect("/login")
    }
    
    const setPassword = promisify(user.setPassword, user);
    await setPassword(req.body.password);
    user.resetPasswordToken = undefined; //reset token
    user.resetPasswordExpires = undefined;
    const updatedUser = await user.save();
    await req.login(updatedUser); //passport method
    req.flash("success", "Account Updated!")
    res.redirect("/")
}
