var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var util =  require('util');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/xadmin');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

var schemas = require('./adminSchema.js');
var User = null;
var Role = null;
var Action = null;
db.once('open', function() {
  console.log('mongoose opened!');
  User = mongoose.model('accounts', schemas.userSchema);
  Role = mongoose.model('roles', schemas.roleSchema);
  Action = mongoose.model('actions', schemas.actionSchema);
});

function hashPW(userName, pwd){
  var hash = crypto.createHash('md5');
  hash.update(userName + pwd);
  return hash.digest('hex');
}

function getLastLoginTime(userName, callback){
  if(!User){
    callback("");
    return;
  }
  var loginTime = Date();
  User.findOne({name:userName}, function(err, doc){
    if(err) callback("");
    else{
      callback(doc.loginedAt == null ? "" : doc.loginedAt.toString());
      
      //update login time
      doc.update({$set:{loginedAt: loginTime}}, function(err, doc){
        if(err) console.log("update login time error: " + err);
        else console.log("update login time for " + doc.name);
      });
    }
  });
}

function authenticate(userName, hash, callback){
  if(!User){ callback(2); return;}
  var query = User.findOne().where('name', userName);
  query.exec(function(err, doc){
    if(err || !doc){ console.log("get user error: " + err); callback(2); return}
    if(doc.hash === hash) callback(0);
    else callback(1);
  });
}

function redirectToLoginViaPath(path, res){
  if(path.indexOf('/admin/fragment/')==0){
    res.redirect('/admin/fragment/embeddedLogin?' + Date.now());
  }else if(path.indexOf('/data/')==0){
    res.status(401).end();
  }else{
    res.redirect('/login?'+Date.now());
  }
}

router.requireAuthentication = function(req, res, next){
  if(req.path == "/login" || req.path == "/admin/fragment/embeddedLogin"){
    next();
    return;
  }
  
  if(req.cookies["account"] != null){
    var account = req.cookies["account"];
    var user = account.account;
    var hash = account.hash;
    authenticate(user, hash, function(ret){ 
      if(ret==0){
        console.log(req.cookies.account.account + " had logined.");
        next();
      }else{
        console.log('invalid user or pwd, redirect to login');
        redirectToLoginViaPath(req.path, res);
      }
    });
  }else{//TODO: differ global request or embedded req or angularjs req
    console.log("not login, redirect to /login");
    redirectToLoginViaPath(req.path, res);
  }
};

router.post('/login', function(req, res, next){
  var userName = req.body.login_username;
  var hash = hashPW(userName, req.body.login_password);
  console.log("login_username - " + userName + " password - " + req.body.login_password + " hash - " + hash);
  authenticate(userName, hash, function(ret){
    switch(ret){
      case 0: //success
        getLastLoginTime(userName, function(lastTime){
          console.log("login ok, last - " + lastTime);
          res.cookie("account", {account: userName, hash: hash, last: lastTime}, {maxAge: 6000000});
          //res.cookie("logined", 1, {maxAge: 60000});
          res.redirect('/admin?'+Date.now());
          console.log("after redirect");
        });
      break;
    case 1: //password error
      console.log("password error");
      res.render('login', {msg:"密码错误"});
      break;
    case 2: //user not found
      console.log("user not found");
      res.render('login', {msg:"用户名不存在"});
      break;
    }
  });
});

router.get('/login', function(req, res, next){
  console.log("cookies:");
  console.log(req.cookies);
  if(req.cookies["account"] != null){
    var account = req.cookies["account"];
    var user = account.account;
    var hash = account.hash;
    authenticate(user, hash, function(ret){
      if(ret == 0) res.redirect('/profile?'+Date.now());
      else res.render('login');
    });
  }else{
    res.render('login');
  }
});

router.get('/logout', function(req, res, next){
  res.clearCookie("account");
  res.redirect('/login?'+Date.now());
});

router.get('/profile', function(req, res, next){
  res.render('profile',{
    msg:"您登录为："+req.cookies["account"].account, 
    title:"登录成功",
    lastTime:"上次登录："+req.cookies["account"].last
  });
});

//redirect / to /admin
router.get('/', function(req, res, next) {
  res.redirect('/admin?'+Date.now());
});

function createMenusFromActions(results){
  var submenuStart = 0;
  var menus = [];
  for(var i = 0; i < results.length; i++){
    if(results[i].parent == -1){
      menus.push({
        text: results[i].name,
        actionId: results[i].actionId,
        order: results[i].order,
        subMenus: []
      });
    }else{
      submenuStart = i;
      break;
    }
  }
  
  for(var j = 0; j < menus.length; j++){
    for(var k = submenuStart; k < results.length; k++){
      if(results[k].parent == menus[j].actionId){
        menus[j].subMenus.push({
          text: results[k].name,
          action: results[k].action,
          order: results[k].order,
        });
      }
    }
  }
  
  /*sort by order*/
  menus.sort(function(a, b){
    return a.order - b.order;
  });
  for(var l = 0; l < menus.length; l++){
    menus[l].subMenus.sort(function(a,b){
      return a.order - b.order;
    });
  }
  
  return menus;
}

/*
  按level升序，查询结果中一级菜单将在最前面
*/
function createMenus(actionIds, callback){
  if(actionIds == null){
    var query = Action.find({});
    query.sort('level value');
    query.exec(function(err, docs){
      if(err || !docs) { callback([]); return; }
      callback(createMenusFromActions(docs));
    });
  }else{
    Action.aggregate([
          {$match:{actionId:{$in: actionIds}}},
          {$sort:{level: 1}},
        ], 
        function(err, docs){
          console.log("find actions - ", docs);
          if(err || !docs){ console.log('get actions failed: ' + err); callback([]); return; }
          callback(createMenusFromActions(docs));
        }
      );
  }
}

router.get('/adminMenu', function(req, res, next){
  console.log("will send menu to - ", req.cookies["account"].account);
  var menus = [];
  var query = User.findOne().where('name', req.cookies["account"].account);
  query.exec(function(err, doc){
    if(err || !doc){ console.log("get user error: " + err); res.send(menus); return;}
    if(doc.roles[0] == -1){//super administrator
      createMenus(null, function(menus){
        console.log(menus);
        res.status(200).send(menus);
      });
      return;
    }
    
    console.log("roles for - ", req.cookies["account"].account, doc.roles);
    
    Role.aggregate([
        {$match:{roleId:{$in: doc.roles}}}
      ], 
      function(err, results){
        console.log(results);
        if(err || !results){console.log("get roles error: " + err); res.status(200).send(menus); return};
        var actions = [];
        for(var i = 0; i < results.length; i++){
          actions = actions.concat(results[i].actions);
        }
        console.log("actions - ", actions);
        createMenus(actions, function(menus){
          console.log(menus);
          res.status(200).send(menus);
        });
      }
    );
  });
});

router.get('/data/user/Roles', function(req, res, next){
  var query = Role.find({});
  query.sort('roleId value');
  query.exec(function(err, docs){
    if(err || !docs) { res.end(404); return; }
    res.json(docs);
  });
});

router.get('/data/user/Actions', function(req, res, next){
  var query = Action.find({});
  query.sort('level value');
  query.exec(function(err, docs){
    if(err || !docs) { res.end(404); return; }
    var repackedActions = [];
    var subMenuStart = 0;
    for(var i = 0; i < docs.length; i++){
      var parentName = "";
      if(docs.parent != -1){
        for(var j = 0; j < docs.length && docs[j].parent == -1; j++){
          if(docs[i].parent == docs[j].actionId){
            parentName = docs[j].name;
            break;
          }
        }
      }
      
      repackedActions.push({
        name: docs[i].name,
        actionId: docs[i].actionId,
        action: docs[i].action,
        level: docs[i].level,
        order: docs[i].order,
        parent: docs[i].parent,
        'parentName': parentName
      });
    }
    res.json(repackedActions);
  });  
});

router.get('/data/user/Users', function(req, res, next){
  var query = User.find({});
  query.exec(function(err, docs){
    if(err || !docs) { res.end(404); return; }
    var q = Role.find({});
    q.select('roleId roles name organization email');
    q.exec(function(err, roles){
      if(err || !roles) { res.end(404); return; }
      var repackedUsers = [];
      for(var i = 0; i < docs.length; i++){
        var u = docs[i];
        var newUser = {
          name: u.name,
          roles: u.roles,
          roleNames: null,
          organization: u.organization,
          email: u.email
        };
        repackedUsers.push(newUser);
        for(var j = 0; j < roles.length; j++){
          for(var k = 0; k < u.roles.length; k++){
            if(u.roles[k] == roles[j].roleId){
              if(newUser.roleNames == null)newUser.roleNames = roles[j].name;
              else newUser.roleNames = newUser.roleNames + ',' + roles[j].name;
            }
          }
        }
      }
      res.json(repackedUsers);
    });
  });  
});

router.get('/dlgTpl/*', function(req, res, next){
  var fileName = req.path.substring(req.path.lastIndexOf('/')+1);
  console.log('/dlgTpl/*, fileName-', fileName);
  if(req.query["value5"] != null){
    console.log("value5-", req.query.value5);
      res.render(fileName, req.query, function(err, html){
        if(req.query.value5 == "enabled"){ html = html.replace("disabled=\"enabled\"","");}
        res.send(html);
      });
  }else{
    res.render(fileName, req.query);
  }
});

router.post('/add/user', function(req, res, next){
  if(req.body.length > 0){
    var user = new User();
    for(var i = 0; i < req.body.length; i++){
      switch(req.body[i].name){
      case 'name':
        user.name = req.body[i].value;
        break;
      case 'email':
        user.email = req.body[i].value;
        break;
      case 'organization':
        user.organization = req.body[i].value;
        break;
      case 'password':
        user.hash = hashPW(user.name, req.body[i].value);
        break;
      case 'selected':
        user.roles = [req.body[i].value.num];
        break;
      }
    }
    user.createAt = Date();
    
    user.save(function(err, doc){
      if(err){console.log('add user failed - ', err); res.status(500).end(); return;}
      res.status(200).end();
    });
  }else{
    res.status(400).end();
  }
});

router.post('/add/role', function(req, res, next){
  console.log('post route for add role - ', req.path);
  console.log(req.body);
  if(req.body.length == 1 && req.body[0].name == 'roleName'){
    Role.aggregate(
      {$group: {_id:null, largest:{$max: "$roleId"}}},
      function(err, results){
      if(err || !results){console.log('get max roleId error - ', err);res.status(400).end(); return;}
      
      console.log('largest roleId - ', results[0].largest);
      doc = new Role({
        roleId: results[0].largest + 1,
        name: req.body[0].value,
        actions: []
      });
      doc.save(function(err, doc){
        if(err){console.log('create role error - ', err);res.status(500).end(); return;}
        res.status(200).end();
      });  
    });
  }else{
    res.status(400).end();
  }
});

router.post('/add/action', function(req, res, next){
  if(req.body.length > 0){
    Action.aggregate(
      {$group: {_id:null, largest:{$max: "$actionId"}}},
      function(err, results){
      if(err || !results){console.log('get max actionId error - ', err);res.status(400).end(); return;}
        
      var action = new Action();
      action.actionId = results[0].largest+1;
      for(var i = 0; i < req.body.length; i++){
        switch(req.body[i].name){
        case 'name':
          action.name = req.body[i].value;
          break;
        case 'action':
          action.action = req.body[i].value;
          break;
        case 'level':
          action.level = req.body[i].value;
          break;
        case 'order':
          action.order = req.body[i].value;
          break;
        case 'selected':
          action.parent = req.body[i].value.num;
          break;
        }
      }

      action.save(function(err, doc){
        if(err){console.log('add action failed - ', err); res.status(500).end(); return;}
        res.status(200).end();
      });
    });    
  }else{
    res.status(400).end();
  }
});

router.post('/set/user/*', function(req, res, next){
  var userName = req.path.substring(req.path.lastIndexOf('/')+1);
  User.findOne({name: userName}, function(err, doc){
    if(err || !doc){console.log('set user error - ', err); res.status(404).end(); return;}
    for(var i = 0; i < req.body.length; i++){
      switch(req.body[i].name){
      case 'email':
        doc.email = req.body[i].value;
        break;
      case 'organization':
        doc.organization = req.body[i].value;
        break;
      case 'password':
        doc.hash = hashPW(userName, req.body[i].value);
        break;
      case 'selected':
        doc.roles = [req.body[i].value.num];
        break;
      }
    }
    doc.save(function(err, doc){
      if(err){console.log('set user failed - ', err); res.status(500).end(); return;}
      res.status(200).end();
    });
  });
});

router.post('/set/role/*', function(req, res, next){
  var id = req.path.substring(req.path.lastIndexOf('/')+1);
  Role.findOne({roleId: parseInt(id)}, function(err, doc){
    if(err || !doc){ console.log('set role error - ', err); res.status(404).end(); return; }
    var query;
    if(util.isArray(req.body) && req.body.length > 0 && req.body[0].name == 'roleName'){
      query = doc.update({$set:{name: req.body[0].value}});
    }else if(req.body.actions != undefined){
      query = doc.update({$set:{actions: req.body.actions}});
    }else{
      console.log("bad request for /set/role/*");
      res.status(400).end();
      return;
    }
    query.exec(function(err, results){
      if(err){console.log("update role - ", id, " failed:", err); res.status(500).end(); return;}
      res.status(200).end();
    });
  });
});

router.post('/set/action/*', function(req, res, next){
  var id = req.path.substring(req.path.lastIndexOf('/')+1);
  Action.findOne({actionId: parseInt(id)}, function(err, action){
    if(err || !action){ console.log('set action error - ', err); res.status(404).end(); return; }

    for(var i = 0; i < req.body.length; i++){
      switch(req.body[i].name){
      case 'name':
        action.name = req.body[i].value;
        break;
      case 'action':
        action.action = req.body[i].value;
        break;
      case 'level':
        action.level = req.body[i].value;
        break;
      case 'order':
        action.order = req.body[i].value;
        break;
      case 'selected':
        action.parent = req.body[i].value.num;
        break;
      }
    }
    
    action.save(function(err, results){
      if(err){ console.log('set action error - ', err); res.status(500).end(); return; }
      res.status(200).end();
    });
  });
});

router.get('/del/user/*', function(req, res, next){
  var userName = req.path.substring(req.path.lastIndexOf('/')+1);
  User.findOneAndRemove({name: userName}, function(err){
    if(err){console.log('delete user [', userName, '] error - ', err); res.status(404).end(); return;}
    res.status(200).end();
  });
});

router.get('/del/role/*', function(req, res, next){
  console.log(req.path);
  var roleId = req.path.substring(req.path.lastIndexOf('/')+1);
  Role.findOneAndRemove({'roleId': parseInt(roleId)}, function(err){
    if(err){console.log('find role for - ', roleId, ' failed - ', err); res.status(404).end(); return;}
    res.status(200).end();
  });
});

router.get('/del/action/*', function(req, res, next){
  var id = req.path.substring(req.path.lastIndexOf('/')+1);
  Action.findOneAndRemove({'actionId': parseInt(id)}, function(err){
    if(err){console.log('find action for - ', id, ' failed - ', err); res.status(404).end(); return;}
    res.status(200).end();
  });
});

module.exports = router;
