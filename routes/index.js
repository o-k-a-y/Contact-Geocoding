var express = require("express");
var router = express.Router();

// Check if user is logged in and redirect to /contacts if so, /login otherwise
router.get("/", async function(req, res, next) {
    if (!req.user) {
        res.redirect("/login");
        return;
    }

    // All contacts in DB
    let allContacts;

    try {
        allContacts = await req.contactCollection.find({}).toArray();
    } catch (ex) {
        console.log(ex);
    }

    res.redirect("contacts");
});

// Render login page
router.get("/login", function(req, res, next) {
    res.render("login.pug");
});

// Logout
router.get("/logout", function(req, res, next) {
    console.log("logout");
    // Invalidate login
    delete req.session.user;

    res.render("login", {
        data: true,
    });
	
})

// Attempt to login
router.post("/login", function(req, res, next) {
    console.log("?????");
	console.log(req.body.username);
    let username = req.body.username;
    let password = req.body.password;

    // Login was correct
    if (username == "cmps369" && password == "finalproject") {
		req.session.user = true;
        res.redirect("/contacts");
    } else {
        // res.redirect("/login");
		res.render("login.pug", {error: "Incorrect credentials"})
    }
});

module.exports = router;
