var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    name: {type: String, unique: true}, 
    hash: String,
    organization: String,
    email: String,
    roles: [Number],
    createdAt: Date,
    loginedAt: Date,
    ip: String,
  }, {collection: "accounts"}
);
exports.userSchema = userSchema;

var actionSchema = new Schema({
    actionId: {type: Number, unique: true},
    name: String,
    action: String,
    level: Number,
    parent: Number,
    order: Number //用于同一级菜单内的显示顺序
  },{collection:"actions"}
);
exports.actionSchema = actionSchema;

var roleSchema = new Schema({
  roleId: {type: Number, unique: true},
  name: String,
  actions: [Number]
  }, {collection:"roles"}
);
exports.roleSchema = roleSchema;


