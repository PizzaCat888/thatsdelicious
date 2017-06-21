const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
//set mongoose promise property to global
const slug = require('slugs')
//libary to make url friendly

const storeSchema = new mongoose.Schema({
name: {
	type:String,
	trim: true, 
	//trim removes unnecessary spacing when storing data
	require: 'Please enter a store name!'
},
slug: String,
description: String,
tags: [String],
created: {
	type:Date,
	default: Date.now
},
location: {
	type: {
	type:String,
	default: "Point"
},
	coordinates:[{ //latiude and longitude 
		type: Number, 
		required: "Must Supply coordinates!"
	}],
	address: {
		type: String, 
		required: "Must supply an address!"

	}
},
photo: String,
author: {
	type: mongoose.Schema.ObjectId,
	ref: "User",
	required: "You Must Supply An Author!"
}
}, {
	toJSON: {virtuals: true}, //this allows our virtual objects to be accessible much easier
	toObject: {virtuals: true}
});

//Indexes Go here. Indexes are properties that help with searching
storeSchema.index({
	name: "text", 
	description: "text"
});

storeSchema.index({location: "2dsphere"})



storeSchema.pre('save',async function(next){
	if(!this.isModified('name')) {
		next(); //skip it
		return; //stop this function from running
	}
	this.slug = slug(this.name);
//the codes below allow our website to properly display stores with the same name.

//find other store names that have a slug of wes, wes-1, wes-2, etc...
const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, "i");
// this.constructor is the way to access the "Store" schema
const storesWithSlug = await this.constructor.find ({slug: slugRegEx});
//if two of the same slug names exist, just add a 1 to it in order to display it in our store page and view pages
if(storesWithSlug.length) {
	this.slug = `${this.slug}--${storesWithSlug.length + 1}`;
}

	next();
});


//We can create our own unqiue schema methods
storeSchema.statics.getTagsList = function() {
	// for more information regarding aggregate,
	// google mongodb aggregation pipeline operators, but this code essentially allows
	// us to filter through our array
	return this.aggregate([
		{$unwind: "$tags"}, // create duplicates for stores with each tag
		{$group: {_id: "$tags", count: {$sum: 1} }}, //group tags by the number of stores with that tag
		{$sort: {count: -1}} //sort tags by popularity/most tagged
	]) 
}

storeSchema.statics.getTopStores = function() {
	return this.aggregate([
		//lookup stores and populate their reviews
		{$lookup: {from:"reviews", localField: "_id", foreignField: "store", as: "reviews" }}, //"reviews" is our Review model, but it has to be lowercase as mongodb lowercases it and adds a s at the end.
		//filter for only itemsthat have 2 or more reviews
		{$match: {"reviews.1":{$exists: true}}}, //where second item in reviews exists
		//add the average reviews field
		{$project: {
			photo: "$$ROOT.photo", //$$ROOT refers to the original doc
			name: "$$ROOT.name",
			reviews: "$$ROOT.reviews",
			slug: "$$ROOT.slug",
			averageRating: { $avg: "$reviews.rating"} //set value to the average of each reviews field
		}},
		//sort it by our own new field, highest reviews first
		{$sort: {averageRating: -1}},
		//limit to 10
		{$limit: 10}
	])
}


//virtual field - find reviews where the stores _id property is equal to a reviews store property
storeSchema.virtual("reviews", {
	ref: "Review", //model name
	localField: "_id", //which field on the sotre
	foreignField: "store" //which field on the review
});

function autopopulate(next) {
	this.populate("reviews");
	next()
}

storeSchema.pre("find", autopopulate);
storeSchema.pre("fineOne", autopopulate);



module.exports = mongoose.model('Store',storeSchema);