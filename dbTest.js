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

var count = 1;

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
  
  //add actions
  var actionId = 0;
  var Action = mongoose.model('actions', adminSchemas.actionSchema);
  
  //role
  var Role = mongoose.model('roles', adminSchemas.roleSchema);
  var query = Role.findOne().where('roleId', 0);
  query.select({actions:1});
  query.exec(function(err, doc){
      console.log("found role - ", doc);
      /*
      query = Action.find();
      query.in('actionId',  doc.actions);
      query.exec(function(err, docs){
        console.log(docs);
      });
      */
      
      Action.aggregate([
          {$match:{actionId:{$in: doc.actions}}},
          {$sort:{level: 1}},
        ], 
        function(err, results){
          if(err)console.log("found actions err-", err);
          else{ 
            console.log(results);
            var submenuStart = 0;
            var menus = [];
            for(var i = 0; i < results.length; i++){
              if(results[i].parent == -1){
                  menus.push({
                    text: results[i].name,
                    actionId: results[i].actionId,
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
                    action: results[k].action
                  });
                  console.log(menus[j].subMenus);
                }
              }
            }
            
            console.log("created:");
            console.log(menus);
          }
          mongoose.disconnect();
        }
      );
  });
  
});

