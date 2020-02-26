const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const logger = require("morgan");
const bcrypt = require("bcrypt");
const ex_session = require('express-session');
// const methodOverride = require('method-override');


// Setup and connect to MongoDB
let contacts;
const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const url = process.env.MONGO_URL || "mongodb://localhost:27017/final";

const startup = async () => {
    try {
        const connection = await MongoClient.connect(url, {
            useUnifiedTopology: true
        });
        const db = connection.db("final");
        contacts = await db.createCollection("contacts");
    } catch (ex) {
        console.error(ex);
    }
};

// Routers
const indexRouter = require("./routes/index");
const mailerRouter = require("./routes/mailer");
const contactsRouter = require("./routes/contacts");

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views")); /* automatically knows it's */
app.set("view engine", "pug"); /* /views/index.pug */

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
// app.use(methodOverride());

// app.use(session);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(ex_session({ secret: 'finalproject' }));
app.use(express.static(path.join(__dirname, "public"))); // stylesheets, images, js


// Add MongoDB to middleware and add the MongoDB collection object to the request object
app.use((req, res, next) => {
    req.contactCollection = contacts;

    next(); // allow us to continue to use other middlewares (go to the NEXT middleware in the chain)
});

app.use("/", indexRouter);
app.use("/mailer", mailerRouter);
app.use("/contacts", contactsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
});

module.exports = app;
startup();
