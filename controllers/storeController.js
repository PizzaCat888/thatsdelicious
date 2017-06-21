const mongoose = require("mongoose");
const Store = mongoose.model("Store")
const multer = require("multer"); //allows us to use multi form data in our form page like pictures
const jimp = require("jimp"); //helps resize our user's uploaded images
const uuid = require("uuid"); //tells our users to create unique image names so they don't override our database
const User = mongoose.model("User")
const multerOptions = { 
	storage: multer.memoryStorage(),
	fileFilter: function(req, file, next){
		const isPhoto = file.mimetype.startsWith("image/");
		if(isPhoto) {
			next(null, true); //move to the next step if file is an image
		} else {
			next({message: "That filetype is not allowed"}, false)
		}
	}
} // this object specfies where our multer data will be stored, and what type of data can be stored


exports.homePage = (req, res) => {
	console.log(req.name);
	res.render('index');
};


exports.addStore = (req, res) => {
	res.render("editStore" , {title: "Add Store"});
};

exports.upload = multer(multerOptions).single("photo");

exports.resize = async (req, res, next) => {
	//check if there is no file to resize
	if(!req.file) {
		next(); //skip to the next middleware
		return;
	}
	console.log(req.file);
	// retrive image type
	const extension = req.file.mimetype.split("/")[1]
	req.body.photo = `${uuid.v4()}.${extension}`;
	//resize image. Remember, our photo is first stored in memory before saving it
	const photo = await jimp.read(req.file.buffer);
	await photo.resize(800, jimp.AUTO);
	//save image to our folder
	await photo.write(`./public/uploads/${req.body.photo}`);
	next();
}

exports.createStore = async (req, res) => {
	req.body.author = req.user._id;
	const store = await (new Store(req.body)).save();
	req.flash("success", `Successfully Created ${store.name}. Leave a review?`);
	res.redirect(`/store/${store.slug}`);
};


exports.getStores = async (req, res) => {
	const page = req.params.page || 1;
	const limit = 6;
	const skip = (page * limit) - limit; //Will be 0 on pg 1

	//query the database for a list of all stores
	const storesPromise = Store
	.find()
	.skip(skip)
	.limit(limit)
	.sort({created: "desc"});

	const countPromise = Store.count();

	const [stores, count] = await Promise.all([storesPromise, countPromise])

	const pages = Math.ceil(count/ limit); //ensures odd numbers will not mess up our page
	if(!stores.length && skip) {
		req.flash("info", `That Page Does Not Exist. Redirecting You To Page ${pages}`)
		res.redirect(`/stores/page/${pages}`)
		return;
}
	res.render("stores", {title: "Stores", stores: stores, page, pages, count});
};

const confirmOwner = (store, user) => {
	if(!store.author.equals(user._id)) {
		//change this to a flash error and redirect in future
		throw Error("You Can Not Edit This Store Because You Do Not Own It")
	}
}

exports.editStore = async (req, res) => {
	//find store by id
	const store = await Store.findOne({_id: req.params.id});
	//check ownership of store
	confirmOwner(store, req.user);
	//render out the edit form so user can update
	res.render("editStore", {title: `Edit ${store.name}`, store: store})
}

exports.updateStore = async (req, res) => {
	//set the location data to be a point when we update
	req.body.location.type = "Point";
	//find and update the store by id
	const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body, {
		new: true, // return the new store instead of the old one
		runValidators: true //force our model to run validators
	}).exec();
	req.flash("success",`Successfully updated ${store.name}. <a href="/stores/${store.slug}">View Store </a>`);
	res.redirect(`/stores/${store._id}/edit`); //redirect to store page
};

exports.getStoreBySlug = async (req, res) => {
	//find store by slug name (URL name)
	const store = await Store.findOne({slug: req.params.slug}).populate("author reviews");
	if(!store) return next(); //if store doesn't exist, return an error to the user(via app.js)
	res.render("store", {store: store, title: store.name});
};

exports.getStoresByTag = async (req, res) => {
	const tag = req.params.tag;
	const tagQuery = tag || {$exists: true}; //if there is no tag, just show all stores with tags
	//We can use multiple query promises to get all tags and to filter through them

	//This promise returns a list of tags with our own unique method in our Store schema
	const tagsPromise = await Store.getTagsList();
	//This promise filters through our store by tag
	const storesPromise = Store.find({tags: tagQuery});

	const [tags, stores] = await Promise.all([tagsPromise, storesPromise]); //return the 2 promises
	//^ ES6 destructuring

	res.render("tag", {tags:tags, title: "Tags", tag: tag, stores: stores});
};


exports.searchStores = async (req, res) => {
  const stores = await Store
  // first find stores that match
  .find({
    $text: {
      $search: req.query.q
    }
  }, {
    score: { $meta: 'textScore' }
  })
  // then sort them
  .sort({
    score: { $meta: 'textScore' }
  })
  // limit to only 5 results
  .limit(5);
  res.json(stores);
};
	
//Store locatator method
exports.mapStores = async (req, res) => {
	const coordinates = [req.query.lng, req.query.lat].map(parseFloat); //mongodb expects our numbers to be in an array
	const q = {
		location: {
			$near: {
				$geometry: {
					type: "Point",
					coordinates: coordinates
				},
				$maxDistance: 10000 //10km
			}
		}
	}

	const stores = await Store.find(q).select("slug name description location photo") //only show the slug, name, and description
	.limit(10);
	res.json(stores)
}

exports.mapPage = (req, res) => {
	res.render("map", {title: "Map"});
}

exports.heartStore = async (req, res) => {
	const hearts = req.user.hearts.map(obj => obj.toString());
	const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet'; //mongodb operator - removes or adds an heart
	const user = await User.findByIdAndUpdate(req.user._id, 
	{[operator]:  //ES6 operator
		{hearts: req.params.id }},
		{new: true}
	);
	res.json(user)
}

exports.getHearts =async (req, res) => {
	const stores = await Store.find({
		_id: {$in: req.user.hearts} //find all stores where their id matches the array
	})
	res.render("stores", {title: "Hearted Stores", stores: stores})
}

exports.getTopStores = async (req, res) => {
	const stores = await Store.getTopStores(); //make our own unique method in our store model
	res.render("topStores", {stores, title:"Top Stores"})
	
}