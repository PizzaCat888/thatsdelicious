const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController.js');
const userController = require('../controllers/userController.js');
const authController = require('../controllers/authController.js');
const {catchErrors} = require("../handlers/errorHandlers");
const reviewController = require('../controllers/reviewController.js');

//Home Page
router.get('/', catchErrors(storeController.getStores)) 

//Store Page
router.get("/stores", catchErrors(storeController.getStores))

//pagination
router.get("/stores/page/:page", catchErrors(storeController.getStores))


//Add Store Page
router.get('/add', authController.isLoggedIn, storeController.addStore) 

//Create store route and middleware for image upload
router.post("/add", 
storeController.upload,
catchErrors(storeController.resize),
catchErrors(storeController.createStore)
);

//update store route and middleware for updating images
router.post("/add/:id", 
storeController.upload, 
catchErrors(storeController.resize),
catchErrors(storeController.updateStore)
);

//Edit store route
router.get("/stores/:id/edit", catchErrors(storeController.editStore))

//view route for store page
router.get("/store/:slug", catchErrors(storeController.getStoreBySlug));

//tags route
router.get("/tags", catchErrors(storeController.getStoresByTag))

//tags route-more more specific 
router.get("/tags/:tag", catchErrors(storeController.getStoresByTag))

//register form route
router.get("/register", userController.registerForm);

//register post route(sending information to the database)
router.post("/register", 
userController.validateRegister, //1. Validate the data 
userController.register, //2.save data to database
authController.login //3. Log the user in
);

//login form route
router.get("/login", userController.loginForm);

//login post route
router.post("/login", authController.login)

//logout route
router.get("/logout", authController.logout)

//User Account route
router.get("/account", authController.isLoggedIn,userController.account)

//User update post route
router.post("/account",catchErrors(userController.updateAccount ))

//Forgot email post route
router.post("/account/forgot", catchErrors(authController.forgot))

//reset account route
router.get("/account/reset/:token", catchErrors(authController.reset))

//update reset account route
router.post("/account/reset/:token", 
authController.confirmedPasswords, 
catchErrors(authController.update))

//map route
router.get("/map", storeController.mapPage)

//heart route
router.get("/hearts", catchErrors(storeController.getHearts))

//reviews route
router.post("/reviews/:id", authController.isLoggedIn, catchErrors(reviewController.addReview))

//top/ranking route
router.get("/top", catchErrors(storeController.getTopStores));



//API
//search engine
router.get("/api/search", catchErrors(storeController.searchStores))
//custom google maps api
router.get("/api/stores/near", catchErrors(storeController.mapStores))
//heart/favourites api
router.post("/api/stores/:id/heart", authController.isLoggedIn,catchErrors(storeController.heartStore))


module.exports = router;

