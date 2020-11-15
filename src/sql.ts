import {userSimple,userLogin} from "./interfaces/user";
const mysql = require('mysql');
const crypto = require('crypto');
import * as email from "./email";
const errors = require("../config/errors.json");
const dotenv = require('dotenv');
dotenv.config();

const connection = mysql.createConnection({
  host: process.env.mysql_host || "localhost",
  port: process.env.mysql_port || 3306,
  user: process.env.mysql_user || "root",
  password: process.env.mysql_password || "root",
  database: process.env.mysql_database || "user"
});

connection.connect();

export function listOfUsers(cb:any) {
  connection.query({
    sql: 'SELECT * FROM `user`;'
  },
    function(error: any, results: any, fields: any) {
      if (error) {
        console.log(error);
      }
      cb("" + results.map((x: any) => x.username).join(" "));
    });
}

export function login(user:userLogin, cb:any) {
  connection.query("SELECT * FROM user where username = ? limit 1", user.username, function(err: any, result: any) {
    if (err) console.log(err);
    if (result[0]?.password === crypto.createHash('sha256').update(user.password).digest('base64')) {
      cb("Password is correct");
    } else {
      cb(errors.no_user_or_bad_password);
    }
  })
}

export function preRegistration(user:userSimple, cb:any) {
  connection.query("SELECT * FROM user where username = ? limit 1", [user.username], function(err: any, result: any) {
    if (err) console.log(err);
    if (result[0] !== undefined) {
      cb(errors.username_already_exists);
    } else {
      if (user.username.length < 3 || user.username.length > 15) {
        cb(errors.username_too_long_or_too_short);
      } else {
        email.sendVerification(user, (message:string) => {
          cb("Code sent.");
        })
      }
    }
  });
}

export function register(user:any, cb:any) {
  connection.query("SELECT * FROM user where username = ? limit 1", [user.username], function(err: any, result: any) {
    if (err) console.log(err);
    if (result[0] !== undefined) {
      cb(errors.username_already_exists);
    } else {
      let hash = crypto.createHash('sha256').update(user.password).digest('base64');
      connection.query("INSERT INTO user (userName, password, email) VALUES (?)", [[user.username, hash, user.email]], function(error: any, resultat: any) {
        if (error) console.log(error);
        cb("account created");
      })
    }
  });
}
