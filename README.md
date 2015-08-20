# XAdmin

A simple web admin project based on Node.js + Express + AngularJS + MongoDB + Mongoose.

Basically, this is a tutorial project for MEAN(MongoDB+Express+Angular+Node.js).

## features

Simple features:

- Login
- Access Control(just like RBAC)
- User, Role, Action(menu) management

## dependencies

see package.json：

    "dependencies": {
      "body-parser": "~1.13.2",
      "cookie-parser": "~1.3.5",
      "debug": "~2.2.0",
      "express": "~4.13.1",
      "jade": "~1.11.0",
      "mongoose": "^4.1.2",
      "morgan": "~1.6.1",
      "serve-favicon": "~2.3.0"
    }

And there are other dependencies:

- AngularJS
- UI Bootstrap
- ngDialog

I'd add them to project manually.

## create

The projects was created by express generator, follow the steps:

1. express XAdmin
2. cd XADmin && npm install
3. npm install mongoose --save

But now, you can run "npm install" directly. Mongoose was written in package.json.

## resources

Here are some links:

- [UI Bootstrap](https://github.com/angular-ui/bootstrap)
- [AngularJS](http://angularjs.org/)
- [Mongoose](http://mongoosejs.com/)
- [ngDialog](https://github.com/likeastore/ngDialog)
- [My Blog](http://blog.csdn.net/foruok)
