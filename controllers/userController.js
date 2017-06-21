const mongoose = require("mongoose");
const User = mongoose.model("User");
const promisify = require("es6-promisify");

exports.loginForm = (req, res) => {
    res.render("login", {title: "Login"})
}

exports.registerForm = (req, res) => {
    res.render("register", {title: "Register"})
};

exports.validateRegister = (req, res, next) => {
    req.sanitizeBody("name") //method found in our app.js, allows us to sanitize the body of the page
    req.checkBody("name", "Please Supply A Name!").notEmpty();
    req.checkBody("email", "That Email Is Not Valid!").isEmail();
    req.sanitizeBody("email").normalizeEmail({
        remove_dots: false,
        remove_extension: false, 
        gmail_remove_subaddress: false
    }); //this function removes confusion from our database when our user registers 

    req.checkBody("password", "Password Cannot Be Blank!").notEmpty();
    req.checkBody("password-confirm", "Confirmed Password Cannot Be Blank").notEmpty();
    req.checkBody("password-confirm", "Oops! Your Passwords Do Not Match!").equals(req.body.password);

    const errors = req.validationErrors();
    if(errors) {
        req.flash("error", errors.map(err => err.msg));
        res.render("register", {title: "Register", body: req.body, flashes:req.flash() })
        return; //stop function from running
    }
    next(); //no errors
}

exports.register = async (req, res, next) => {
    const user = new User({email: req.body.email, name: req.body.name});
    const register = promisify(User.register, User); //we use the promisify library not every method supports async await.
    await register(user, req.body.password); //stores password in a an encrypted hashtag
    next() //go to auth login
}

exports.account = (req, res) => {
    res.render("account", {title: "Edit Account"})
}

exports.updateAccount = async (req, res) => {
    const updates = {
        name: req.body.name,
        email: req.body.email
    };

    const user = await User.findOneAndUpdate(
        {_id: req.user._id}, //query
        {$set: updates}, //what we want to update with
        {new: true, runValidators: true, context: "query"} //options and extra steps
    );

    req.flash("success", "Account Updated!")
    res.redirect("/account");

    
}