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

- AngularJS(1.4.3)
- UI Bootstrap(0.13.3)
- ngDialog(0.4.0)
- Bootstrap CSS(3.1.1)

I'd add them to project manually. They reside in these directories:

- public/javascripts 
- public/stylesheets

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
- [Foruok's Blog](http://blog.csdn.net/foruok)

## Run

Follow these steps:

1. clone the XAdmin project
2. cd XAdmin && npm install
3. install MongoDB && run it
4. npm start
