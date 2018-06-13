var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken');
var FacebookTokenStrategy = require('passport-facebook-token');

var config = require('./config');

exports.local = passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getToken = function(user) {
  return jwt.sign(user, config.secretKey,
    {expiresIn: 3600});
};

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(new JwtStrategy(opts,
  (jwt_payload, done) => {
      console.log('JWT payload: ', jwt_payload)
      User.findOne({_id: jwt_payload._id}, (err, user) => {
        if (err) {
          return done(err, false);
        }
        else if (user) {
          return done(null, user);
        }
        else {
          return done(null, false);
        }
      });

  }));

exports.verifyUser = passport.authenticate('jwt', {session: false});
exports.verifyAdmin = function(req, res, next) {
  if (req.user.admin === true) {
    next();
  }
  else {
    var err = new Error('You are not authorized to perform this operation!');
    err.status = 403;
    return next(err);
  }
};

exports.facebookPassport = passport.use(new FacebookTokenStrategy({
    clientID: config.facebook.clientId,
    clientSecret: config.facebook.clientDecret
  }, (accessToken, refreshToken, profile, done) => {
      User.findOne({facebookId: profile.id}, (err, user) => {
        if (err) {
          return done(err, false);
        }
        if (!err && user!== null) {
          return done(null, user);
        }
        else {
          user = new User({username: profile.displayName});
          user.facebookId = profile.id;
          user.firstname = profile.name.givenName;
          user.lastname = profile.name.familyName;
          user.save((err, user) => {
            if (err){
              return done(err, false)
            }
            else{
              return done(null, user);
            }
          })
        }
      });
  }
));
