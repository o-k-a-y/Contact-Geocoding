$(document).ready(function() {
    map = L.map("mapid").setView([41.0819, -74.1758], 13);

    L.tileLayer(
        "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=" +
            L.mapbox.accessToken,
        {
            maxZoom: 20,
            id: "mapbox.streets",
            accessToken: L.mapbox.accessToken
        }
    ).addTo(map);

    // Place all markers from contact collection
    placeMarkers();

    // On clicks for add/udpdate/delete buttons
    $("#addButton").on("click", addContact);
    $("#updateButton").on("click", updateContact);
    $("#deleteButton").on("click", deleteContact);
    $("#logout").on("click", logout);
});

let map;
L.mapbox.accessToken =
    "pk.eyJ1IjoiZ2VvY29kZSIsImEiOiJjazJwaGVkZXEwM2xoM2tscjh3MzgwdDUxIn0.k5udBKWzW3xnZiKf6oJjHw";
const geocoder = L.mapbox.geocoder("mapbox.places");

const marker = {
    icon: L.mapbox.marker.icon({
        "marker-size": "large",
        "marker-color": "#fa0"
    })
};

// Logout (redirect to login screen and remove user from session)
async function logout() {
    try {
        var log_out = await $.ajax({
            url: "/logout",
            type: "get",
            data: {},
        });
    } catch (ex) {
        console.log(ex);
    }
    window.location.reload();
}

// Add a marker for a contact
const addMarker = contact => {
    var latlng = getLatLong(contact.latlong);
    let placed = new L.marker(latlng, marker)
        .bindPopup("<b>" + contact.name + "</b><br />" + contact.address)
        .addTo(map);

    $("#" + contact._id).data("marker", placed);
};


// Delete the contact's marker
const deleteContactMarker = rowId => {
    let rowMarker = $("#" + rowId).data("marker");

    map.removeLayer(rowMarker);
};

// Set the view and zoom for each contact
const setView = contact => {
    map.setView(contact.data("latlng"), 15);
    $("#selectableContact > input")
        .val(contact.data("name"))
        .data("contactId", contact.data("contactId"));
};

// Fill the form with info from table row
const populateForm = contact => {
    $("#contactId").val(contact._id);

    // Name
    if (contact.surname == "Mr.") {
        $("#mr").prop("checked", true);
    } else if (contact.surname == "Mrs.") {
        $("#mrs").prop("checked", true);
    } else if (contact.surname == "Ms.") {
        $("#ms").prop("checked", true);
    } else {
        $("#dr").prop("checked", true);
    }

    $("#first").val(contact.first);
    $("#last").val(contact.last);

    // Address
    $("#street").val(contact.street);
    $("#city").val(contact.city);
    $("#zip").val(contact.zip);
    $("select").val(contact.state);

    // Contact info
    $("#phone").val(contact.phone);
    $("#email").val(contact.email);

    // Phone, mail, email
    if (contact.contactByPhone) {
        $("#contactByPhone").prop("checked", true);
    } else {
        $("#contactByPhone").prop("checked", false);
    }

    if (contact.contactByMail) {
        $("#contactByMail").prop("checked", true);
    } else {
        $("#contactByMail").prop("checked", false);
    }

    if (contact.contactByEmail) {
        $("#contactByEmail").prop("checked", true);
    } else {
        $("#contactByEmail").prop("checked", false);
    }

    if (
        contact.contactByEmail &&
        contact.contactByMail &&
        contact.contactByPhone
    ) {
        $("#contactByAny").prop("checked", true);
        $("#contactByPhone").prop("checked", false);
        $("#contactByMail").prop("checked", false);
        $("#contactByEmail").prop("checked", false);
    } else {
        $("#contactByAny").prop("checked", false);
    }
};

// Reset the values in the form
const resetForm = () => {
    $("form")[0].reset();
    $("#error").val("");

    // Clear selected table row
    clearSelection();
};

// Get the contact object from mongoDB by ID
const getContactFromDB = (id, callback) => {
    $.getJSON("/contacts/latlong", { id: id }, function(data) {
        callback(data.result);
    });
};

// Get the lat/long
const getLatLong = latLongStr => {
    let latlng = latLongStr.split(",");
    
    latlng[0] = parseFloat(latlng[0]);
    latlng[1] = parseFloat(latlng[1]);
    
    return latlng;
};

// Place all the markers from contact collection DB based on lat/long
const placeMarkers = () => {
    $("tbody").on("click", "tr", function() {
        $(".selectedContact").removeClass("selectedContact");
        $(this).addClass("selectedContact");
        getContactFromDB($(this).attr("id"), function(contact) {
            var latlng = getLatLong(contact.latlong);
            $(this)
                .data("latlng", latlng)
                .data("name", contact.name)
                .data("contactId", contact._id);
            setView($(this));
            populateForm(contact);
        });
    });

    $("tr:not(:first)").each(function() {
        var row = $(this);
        getContactFromDB(row.attr("id"), addMarker);
    });
};

// Query contact lat/long and add to DB
const addContact = () => {
    if (!validateForm()) {
        return false;
    }

    let street = $("#street").val();
    let city = $("#city").val();
    let state = $("select").val();
    let zip = $("#zip").val();

    let address = street + ", " + city + ", " + state + " " + zip;
    geocoder.query(address, addContactToDB);
};

// Add contact object to contacts collection in DB
async function addContactToDB(err, data) {
    if (err) {
        console.log(err);
        return;
    }

    // Add to DB
    $("#latlng").val(data.latlng);
    try {
        var newContact = await $.ajax({
            url: "/contacts",
            type: "put",
            data: $("form").serialize()
        });
    } catch (ex) {
        console.log(ex);
    }

    let newId = newContact._id;
    let tableRow = $("<tr></tr>").attr("id", newId);

    let latlng = newContact.latlong;
    let newContactData = [
        newContact.name,
        newContact.address,
        newContact.email,
        newContact.phone,
        newContact.contactByPhone,
        newContact.contactByMail,
        newContact.contactByEmail
    ];
    console.log(newContact);
    console.log(newContactData);
    for (i = 0; i < newContactData.length; i++) {
        tableRow.append($("<td>" + newContactData[i] + "</td>"));
    }

    // Update table
    $("table").append(tableRow);
    newContact.latlong = latlng;
    addMarker(newContact);
    resetForm();
}

// Clear selected table row
const clearSelection = () => {
    $("#" + $("#selectableContact > input").data("contactId")).removeClass(
        "selectedContact"
    );
    $("#selectableContact > input")
        .val("")
        .data("contactId", undefined);
};

// Query contact's lat/long and update data in DB
const updateContact = () => {
    if (!validateForm()) {
        return;
    }

    let street = $("#street").val();
    let city = $("#city").val();
    let state = $("select").val();
    let zip = $("#zip").val();

    let address = street + ", " + city + ", " + state + " " + zip;
    geocoder.query(address, updateContactInDB);
};

// Validate form data
const validateForm = () => {
    let street = $("#street").val();
    let city = $("#city").val();
    let state = $("select").val();
    let zip = $("#zip").val();

    if (zip.length != 5 || isNaN(zip)) {
        $("#error").text("Please enter a 5 digit zip code: i.e. 07430");
        return false;
    }

    return true;
};

// Submit new contact
async function updateContactInDB(err, data) {
    if (err) {
        console.log(err);
        return;
    }

    // Update data in DB
    $("#latlng").val(data.latlng);
    try {
        let update = await $.ajax({
            url: "/contacts",
            type: "patch",
            data: $("form").serialize()
        });

        // The row we're updating
        let tableRow = $("#" + update._id);

        // New contact data
        let data = [
            update.name,
            update.address,
            update.email,
            update.phone,
            update.contactByPhone,
            update.contactByMail,
            update.contactByEmail
        ];

        // Update the contact information in table
        tableRow.children().each(function(index, child) {
            $(child).text(data[index]);
        });

        // Delete older marker and add new marker
        deleteContactMarker(update._id);
        addMarker(update);

        // Clear everything in the form
        resetForm();
    } catch (ex) {
        console.log(ex);
    }
}

// Delete contact in DB
async function deleteContact() {
    var rowId = $("#selectableContact > input").data("contactId");
    try {
        let update = await $.ajax({
            url: "/contacts",
            type: "delete",
            data: { id: rowId }
        });

        // If updates was successful, delete from table
        if (update.success) {
            deleteContactMarker(rowId);
            $("#" + rowId).remove();
            clearSelection();
        } else {
            console.log("can't delete");
        }
    } catch (ex) {
        console.log(ex);
    }

    resetForm();
}
