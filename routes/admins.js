var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('admin', {userName: req.cookies.account.account});
});

router.get('/fragment/action', function(req, res, next) {
  res.render('action');
});

router.get('/fragment/role', function(req, res, next){
  res.render('role');
});

router.get('/fragment/user', function(req, res, next){
  res.render('user');
});

router.get('/fragment/embeddedLogin', function(req, res, next){
  res.render('embeddedLogin');
});

module.exports = router;
