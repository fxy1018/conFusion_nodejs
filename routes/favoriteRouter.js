const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorites');
const Users = require('../models/user');

const favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200);})
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
  Favorites.find({user: req.user})
    .populate('user dishes')
    .then((favorite) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(favorite);
    }, (err)=> next(err))
    .catch((err)=> next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  Favorites.find({user:req.user})
    .populate('user dishes')
    .then((favorite) => {
      if (favorite.length >0) {
        for (var i = (req.body.length -1); i >= 0; i--) {
          if (favorite[0].dishes.indexOf(req.body[i]._id) > -1){
            favorite[0].dishes.push(req.body[i]._id);
            favorite[0].save()
              .then((favorite) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
              }, (err) => next(err));
          }
        }
      }
      else {
        newfavorite = {user: req.user._id, dishes: []};
        for (var i = (req.body.length -1); i >= 0; i--) {
          newfavorite.dishes.push(req.body[i]._id);
        }
        Favorites.create(newfavorite)
          .then((favorite) => {
            console.log('Favorite Created ', favorite);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite)
          }, (err) => next(err))
          .catch((err)=> next(err));
      }
    },(err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  res.statusCode = 403;
  res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  Favorites.findOneAndRemove({user: req.user})
    .then((resp) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req, res, next)=>{
  Favorites.findOne({user: req.user._id})
    .then((favorites) => {
      if (!favorites){
        res.statusCode=200;
        res.setHeader('Content-Type', 'application/json');
        return res.json({"exists": false, "favorites":favorites})
      }
      else {
        if (favorites.dishes.indexOf(req.params.dishId) < 0){
          res.statusCode=200;
          res.setHeader('Content-Type', 'application/json');
          return res.json({"exists": false, "favorites":favorites})
        }
        else{
          res.statusCode=200;
          res.setHeader('Content-Type', 'application/json');
          return res.json({"exists": true, "favorites":favorites})
        }
      }
    })
    .catch((err)=>next(err))
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
  Favorites.find({user: req.user})
    .then((favorite) => {
      if (favorite.length == 0){
        tmp = {user: req.user.id, dishes:[req.params.dishId]}
        Favorites.create(tmp)
          .then((favorite) => {
            console.log('Favorite Created ', favorite);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite)
          }, (err) => next(err))
          .catch((err)=> next(err));
      }
      else if (favorite.length != 0 && favorite[0].dishes.indexOf(req.params.dishId) > -1){
        err = new Error('Dish ' + req.params.dishId + ' is exsit');
        err.status = 404;
        return next(err);
      }
      else {

        favorite[0].dishes.push(req.params.dishId)
        favorite[0].save()
          .then((favorite) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite)
          }, (err) => next(err))
          .catch((err)=>next(err));
      }
    }, (err) => next(err))
    .catch((err)=> next(err));

})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>{
  Favorites.find({user: req.user})
    .then((favorite) => {
      if (favorite.length != 0  && favorite[0].dishes.indexOf(req.params.dishId) > -1){
        var index = favorite[0].dishes.indexOf(req.params.dishId);
        favorite[0].dishes.splice(index, 1);
        favorite[0].save()
          .then((favorite) => {
            Favorites.findById(favorite._id)
              .populate('user')
              .populate('dishes')
              .then((favorite)=>{
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
              })
          }, (err)=>next(err));
      }
      else{
        var err = new Error('Dish ' + req.params.dishId + ' can not delete');
        err.status = 403;
        return next(err);
      }
    }, (err) => next(err))
    .catch((err) => next(err));
})



module.exports = favoriteRouter;
