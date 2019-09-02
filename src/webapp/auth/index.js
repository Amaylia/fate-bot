/**
 * Created by jhelmuth on 7/16/16.
 */

const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const bi = require('../bot_interface');

const scopes = [
    'identify',
    //'email',
    /* 'connections', (it is currently broken) */
    //'guilds.join',
    'guilds'
];

function Auth() {
    this.authenticate = null;
}

Auth.prototype.initialize = function setupAuth(app, config) {
    passport.serializeUser(function (user, done) {
        done(null, user);
    });
    passport.deserializeUser(function (obj, done) {
        done(null, obj);
    });

    const bot_config = config('bot');
    passport.use(new DiscordStrategy({
            clientID: bot_config.client_id,
            clientSecret: bot_config.client_secret,
            callbackURL: config('app').domain + '/callback',
            scope: scopes
        },
        function (accessToken, refreshToken, profile, done) {
            // profile.id has the discord user id in it.
            process.nextTick(function () {
                // this will just stick the discord User profile into the session
                return done(null, profile);
            });
        }
    ));

    app.use(passport.initialize());
    app.use(passport.session());

    app.get('/login', passport.authenticate('discord', {scope: scopes}),
        function(req, res) {
            console.log('redirecting to Discord to authenticate.');
            res.end('redirecting to Discord to authenticate.');
        }
    );

    app.get('/callback', passport.authenticate('discord', {
        successRedirect: '/',
        failureRedirect: '/unauthorized'
    }));

    app.get('/logout', function(req, res) {
        console.log('/logout called.');
        req.logout();
        res.redirect('/');
    });

    app.get('/unauthorized', function(req, res) {
        console.log('/unauthorized called.');
        res.status(403).send("You are unauthorized to use this site.");
    });
};

Auth.prototype.checkAuth = checkAuth;
function checkAuth(req, res, done) {
    console.log('checkAuth() ' + req.path + ' checking authentication. req.isAuthenticated(): ', req.isAuthenticated());
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    console.log('checkAuth() checking if user is known to bot client. req.user.id: ', req.user.id);
    bi.hasUser(req.user.id)
        .then(function (has_user) {
            console.log('checkAuth() has_user: ', has_user);
            if (has_user) {
                return done();
            }
            return res.redirect('/unauthorized');
        })
        .catch(function (err) {
            console.log('checkAuth() err: ', err);
            return res.redirect('/unauthorized');
        });
}

module.exports = new Auth();
