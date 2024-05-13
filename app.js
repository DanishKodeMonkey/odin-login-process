// More securely stored URI to DB
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// Express for node
const express = require('express');

// Path for routing
const path = require('path');

// Session for passport, is a dependency, creates unique session ID stored server side
const session = require('express-session');

// Passport, for our authentication work
const passport = require('passport');

// localStrategy
const localStrategy = require('passport-local').Strategy;

// Mongoose for MongoDB interaction
const mongoose = require('mongoose');

// Schema, for user account schema
const Schema = mongoose.schema;

// First, assign connection string
const mongoDb = process.env.MONGO_URI;

// Connect
mongoose.connect(mongoDb);

// Referal varialbe
const db = mongoose.connection;

// Handle errors
db.on('error', console.error.bind(console, 'mongo connection error'));

// User schema for storing credentials
const User = mongoose.model(
    'User',
    new Schema({
        username: { type: String, required: true },
        password: { type: String, required: true },
    })
);

// Initiate app
const app = express();

// Set up view templating engine
app.set('views', __dirname);
app.set('view engine', 'ejs');

// Initialise session
app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));

// Attach authentication to session
app.use(passport.session());

// encode URL
app.use(express.urlencoded({ extended: false }));

// get relevant views, assign URLs
app.get('/', (req, res) => res.render('index'));
app.get('sign-up', (req, res) => res.render('sign-up-form'));

// app POST for sign up form so we can add users to our database
// REMEMBER in a real scenario, make sure to sanitize credentials
app.post('/sign-up', async (req, res, next) => {
    try {
        const user = new User({
            username: req.body.username,
            password: req.body.password,
        });
        const result = await user.save();
        res.redirect('/');
    } catch (err) {
        return next(err);
    }
});

app.listen(3000, () => console.log('App listening on port 3000!'));
