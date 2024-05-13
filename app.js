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
const LocalStrategy = require('passport-local').Strategy;

// Mongoose for MongoDB interaction
const mongoose = require('mongoose');

// Schema, for user account schema
const Schema = mongoose.Schema;

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
app.get('/', (req, res) =>
    res.render(
        'index',
        // Send the user object to the index if available
        { user: req.user }
    )
);
app.get('/sign-up', (req, res) => res.render('sign-up-form'));

/// Signing up ///

// app POST for sign up form so we can add users to our database
// REMEMBER in a real scenario, make sure to sanitize credentials
app.post('/sign-up', async (req, res, next) => {
    // Try to create a new user object, and save to DB
    try {
        const user = new User({
            username: req.body.username,
            password: req.body.password,
        });
        const result = await user.save();
        // Success? Redirect to index
        res.redirect('/');
    } catch (err) {
        // Fail? Toss err
        return next(err);
    }
});

/// Logging in ///

// Set up a LocalStrategy auth process using passport middleware
passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            // Find the user
            const user = await User.findOne({ username: username });
            // user not found
            if (!user) {
                return done(null, false, { message: 'Incorrect username' });
            }
            // match user.password against given password
            if (user.password !== password) {
                // password incorrect
                return done(null, false, { message: 'Incorrect password' });
            }
            // Bot user and password match, success!
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);

/// Handling cookies ///

// Passport will create cookies on the users browser with their authentication to allow them
// stay logged in during their visit

// use seriealize and deserialise user to determine what information passport should look for when
// creating and decoding the cookies

// create
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// decode
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Now passport will receive the user object on login and store its id in the session data.
// Upon any other request, if a matching session is found for that request, passport
// will find that retrieve the id stored, and use it to query our database for the user.
// finally, the user object will be attached to req.user.

// now add a post to the app listening to the index page /log-in action
// and run authentication using passport.authenticate
app.post(
    '/log-in',
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/',
    })
);

// Finally, allow the user to log out again, by creating a route
app.get('/log-out', (req, res, next) => {
    // this will use a method to clear the cookie
    req.logout(err => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});
app.listen(3000, () => console.log('App listening on port 3000!'));
