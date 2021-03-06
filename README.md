# Contact-Geocoding
Node.js web application that takes contact data to create entries in a database for CRUD operations as well as create map markers using Express, MongoDB, LeafletJS, and Mapbox. 

## Install
Make sure you have NodeJS and MongoDB installed: 
- https://docs.mongodb.com/manual/administration/install-community/
- https://www.npmjs.com/get-npm
Clone this repo
Change directory to where it's been cloned to
Run npm install
Run npm start

## Routes
### /
Redirects to /login page

### /mailer
Allows anyone, authenticated or not, to fill out a form with user information including name and address.
This creates a geocoded contact document into the MongoDB contacts collection. 

### /login
Allow authenticated users to log in and view database
Once logged in, will redirect you to /contacts route

### /contacts
Once signed in, the user will be redirected to the /contacts page.
Here you can see:
- a table of all users and their information
- a map containing markers for each user located at their geolocation
- a form for CRUD operations on each user document
