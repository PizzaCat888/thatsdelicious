const mongoose = require("mongoose");
const Review = mongoose.model("Review")

exports.addReview = async (req, res) => {
    req.body.author = req.user._id; 
    req.body.store = req.params.id;
    const newReview = new Review(req.body); //save comments to database first before populating
    await newReview.save();
    req.flash("success", "Review Saved!")
    res.redirect("back")
}