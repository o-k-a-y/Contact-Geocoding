const express = require("express");
const router = express.Router();

// Server side geocoder
const nodegeocoder = require("node-geocoder");
const options = {
    provider: "google",

    // Optional depending on the providers
    httpAdapter: "https", // Default
    apiKey: "AIzaSyAm7zBcEo6jj8MnxKhZmrIx6V9VEy7aUDc", // for Mapquest, OpenCage, Google Premier
    formatter: null // 'gpx', 'string', ...
};
const geocoder = nodegeocoder(options);

/* GET mailer page. */
router.get("/", function(req, res, next) {
    res.render("mailer", { title: "Sign up" });
});

/* POST mailer page. */
router.post("/", async function(req, res, next) {
    //console.log(req);
    // Contact to add to DB
    let contact = req.body;

    // Validate data passed in and perform some changes
    validateData(contact);

    // Query submitted location information and set field for lat/long
    geocoder.geocode(contact.address)
        .then(function(res) {
            let latitude = "" + res[0].latitude;
            let longitude = "" + res[0].longitude;
            contact.latlong = latitude + "," + longitude;
            // Add new contact information to a record in the contacts collection
            addContactToDB(req, contact);
        })
        .catch(function(err) {
            console.log(err);
        });

    

    res.render("newContact", { title: "Thank You", contactData: contact });
});

// Validate the data passed from form
const validateData = (formData) => {
    if (formData.contactByAny) {
        formData.contactByPhone = formData.contactByMail = formData.contactByEmail = true;
    } else {
        formData.contactByPhone = formData.contactByPhone ? true : false;
        formData.contactByMail = formData.contactByMail ? true : false;
        formData.contactByEmail = formData.contactByEmail ? true : false;
    }

    // Format the address
    formData.address =
        formData.street +
        ", " +
        formData.city +
        ", " +
        formData.state +
        " " +
        formData.zip;

    // Format name
	formData.name = formData.surname + " " + formData.first + " " + formData.last;		
};

// Add record to DB
const addContactToDB = async (req, record) => {
    console.log(record);
    try {
        await req.contactCollection.insertOne(record);
    } catch (ex) {
        console.error(ex);
    }
};

module.exports = router;
