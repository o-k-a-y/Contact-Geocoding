var express = require("express");
var router = express.Router();
const ObjectID = require("mongodb").ObjectID;

// Get the contacts page
router.get("/", async function(req, res, next) {
    // Ensure logged in
    if (!req.session.user) {
        res.redirect("/login");
    }

    let allContacts;

    try {
        allContacts = await req.contactCollection.find({}).toArray();
    } catch (ex) {
        console.log(ex);
    }

    res.render("contacts", {
        data: allContacts,
        username: req.session.username
    });
});

// Add a new contact to DB and return new contact
router.put("/", async function(req, res, next) {
    // Ensure logged in
    if (!req.session.user) {
        res.redirect("/login");
    }

    delete req.body._id;

    // Return nothing if data is invalid
    if (!validateData(req.body)) {
        res.json({});
    }
    let data = formatData(req.body);

    // Insert contact into DB
    try {
        let inserted = await req.contactCollection.insertOne(data);
        var newContact = inserted.ops;
        newContact = newContact[0];
    } catch (ex) {
        console.log(ex);
    }

    res.json(newContact);
});

// Update a new contact in DB and return new contact
router.patch("/", async function(req, res, next) {
    // Ensure logged in
    if (!req.session.user) {
        console.log("????");
        res.redirect("/login");

    }

    const id = req.body._id;
    delete req.body._id;

    // Return nothing if data is invalid
    if (!validateData(req.body)) {
        res.json({});
    }

    // Update the contact in DB
    let data = formatData(req.body);
    try {
        await req.contactCollection.updateOne(
            { _id: ObjectID(id) },
            { $set: data }
        );
        var update = await req.contactCollection.findOne({ _id: ObjectID(id) });
    } catch (ex) {
        console.log(ex);
    }

    res.json(update);
});


// Delete a contact in the DB
router.delete("/", async function(req, res, next) {
    // Ensure logged in
    if (!req.session.user) {
        res.redirect("/login");
    }
    
    const id = req.body.id;

    try {
        await req.contactCollection.deleteOne({ _id: ObjectID(id) });
        res.json({ success: true });
    } catch (ex) {
        console.log(ex);
        res.json({ success: false });
    }
});


// Get the lat/long data from contact from ID
router.get("/latlong", async function(req, res, next) {
    // Ensure logged in
    if (!req.session.user) {
        res.redirect("/login");
    }

    const id = req.query.id;

    // If there was no id passed
    if (id === undefined) {
        return;
    }

    // Get contact from DB from ID
    try {
        let latlng = await req.contactCollection.findOne({ _id: ObjectID(id) });
        console.log(latlng);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ result: latlng }));
    } catch (ex) {
        console.log(ex);
    }
});

// Format the name, address, and true/false for contact methods
const formatData = (data) => {
    // Set whether we can contact contact by method
    if (!data.contactByAny) {
        if (data.contactByMail == undefined) {
            data.contactByMail = false;
        } else {
            data.contactByMail = true;
        }

        if (data.contactByEmail == undefined) {
            data.contactByEmail = false;
        } else {
            data.contactByEmail = true;
        }

        if (data.contactByPhone == undefined) {
            data.contactByPhone = false;
        } else {
            data.contactByPhone = true;
        }
    } else {
        data.contactByMail = true;
        data.contactByEmail = true;
        data.contactByPhone = true;
    }

    // Name
    data.name = data.surname + " " + data.first + " " + data.last;

    // Address
    data.address =
        data.street + ", " + data.city + ", " + data.state + " " + data.zip;

    return data;
}

// Minimal level of form validation
const validateData = (data) => {
    let formKeys = ["first", "last", "street", "city", "zip"];

    // Make sure we have at least these keys
    for (key of formKeys) {
        if (data[key] == undefined || data[key] == "") {
            res.redirect("/contacts");
            return false;
        }
    }

    return true;
}


module.exports = router;
