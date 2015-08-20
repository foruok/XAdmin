var crypto = require('crypto');
var mongoose = require('mongoose');
var adminSchemas = require('./routes/adminSchema.js');

mongoose.connect('mongodb://localhost/xadmin');

function hashPW(userName, pwd){
  var hash = crypto.createHash('md5');
  hash.update(userName + pwd);
  return hash.digest('hex');
}

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

var count = 11;

function checkClose(){
  count = count - 1;
  if(count==0) mongoose.disconnect();
}

function saveCallback(err, doc){
    if(err)console.log(err);
    else console.log(doc.name + ' saved');
    checkClose();
}

db.once('open', function() {
  console.log('mongoose opened!');
  var User = mongoose.model('accounts', adminSchemas.userSchema);

  var doc = new User({
    name:"admin", hash: hashPW("admin","123456"), 
    organization: 'A公司',
    email: 'liubei@axxx.com',
    roles:[-1],
    createdAt:Date(), loginedAt:null, ip:""
  });
  doc.save(saveCallback); 
  
  doc = new User({
    name:"foruok", hash: hashPW("foruok","888888"), 
    organization: 'A公司',
    email: 'foruok@axxx.com',
    roles:[0],
    createdAt:Date(), loginedAt:null, ip:""
  });
  doc.save(saveCallback); 
  
  //add actions
  var actionId = 0;
  var Action = mongoose.model('actions', adminSchemas.actionSchema);
  doc = new Action({
    actionId: actionId++,
    name: "系统管理",
    action: "",
    level: 1,
    parent: -1,
    order: 0
  });
  doc.save(saveCallback);
  
  doc = new Action({
    actionId: actionId++,
    name: "说说管理",
    action: "",
    level: 1,
    parent: -1 ,
    order: 1
  });
  doc.save(saveCallback);
  
  doc = new Action({
    actionId: actionId++,
    name: "用户管理",
    action: "/admin/fragment/user?data.user.Users",
    level: 2,
    parent: 0,
    order: 0
  });
  doc.save(saveCallback);
  
  doc = new Action({
    actionId: actionId++,
    name: "角色管理",
    action: "/admin/fragment/role?data.user.Roles",
    level: 2,
    parent: 0,
    order: 1
  });
  doc.save(saveCallback);
  
  doc = new Action({
    actionId: actionId++,
    name: "权限管理",
    action: "/admin/fragment/action?data.user.Actions",
    level: 2,
    parent: 0,
    order: 2
  });
  doc.save(saveCallback);  
  
  doc = new Action({
    actionId: actionId++,
    name: "管理",
    action: "/admin/fragment/managePost",
    level: 2,
    parent: 1,
    order: 0
  });
  doc.save(saveCallback);  

  doc = new Action({
    actionId: actionId++,
    name: "发布",
    action: "/admin/fragment/writePost",
    level: 2,
    parent: 1,
    order: 1
  });
  doc.save(saveCallback);    
  
  //role
  var Role = mongoose.model('roles', adminSchemas.roleSchema);
  doc = new Role({
    roleId: -1,
    name: "超级管理员",
    actions: [-1]
  });
  doc.save(saveCallback);
  
  doc = new Role({
    roleId: 0,
    name: "说说管理员",
    actions: [1,5,6]
  });
  doc.save(saveCallback);
});

