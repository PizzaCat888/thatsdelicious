const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require("md5"); //For gravator. hashing algorthim for emails
const validator = require("validator")
const mongodbErrorHandler = require("mongoose-mongodb-errors");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        unique: true, //no duplicate emails allowed
        lowercase: true, //lowercase only,
        trim: true, //removes spaces in email
        validate: [validator.isEmail, "Invalid Email Address"],
        required: "Email Address Required"
    },

    name: {
        type: String,
        trim: true, 
        required: "Please Supply A Name!"

    },
     resetPasswordToken: String, 
     resetPasswordExpires: Date,
     hearts: [
         {type: mongoose.Schema.ObjectId, ref: "Store"}
     ]
});

//We can make a virtual field to create an gravator-an global property that changes with the user
//in this case, its an image through our md5 package
userSchema.virtual('gravatar').get(function(){
    const hash = md5(this.email);
    return `https://gravatar.com/avatar/${hash}?s=200`;
});

userSchema.plugin(passportLocalMongoose,{usernameField: "email"})
userSchema.plugin(mongodbErrorHandler); //shows "nicer" errors






module.exports = mongoose.model("User", userSchema);