const nodemailer = require("nodemailer");
const fs = require("fs");
const { HttpResponse } = require("uWebSockets.js");
import { userSimple } from "./interfaces/user";
const errors = require("../config/errors.json");
import * as sql from "./sql"
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport(
  {
    host: process.env.stmp_host,
    port: 465,
    auth: {
      user: process.env.stmp_user,
      pass: process.env.stmp_password
    },
    logger: false,
    debug: false
  },
  {
    from: `${process.env.stmp_username} <${process.env.stmp_user}>`
  }
);

const verification_mail_sent = new Map();

export function sendVerification(user: userSimple, cb: InstanceType<typeof HttpResponse>) {
  function getRandomNumber(): number {
    return Math.floor(Math.random() * Math.floor(99999));
  }

  const first_number: number = getRandomNumber();
  const second_number: number = getRandomNumber();

  const message = {
    to: `${user.username} <${user.email}>`,
    subject: 'LnChall - Complétez votre inscription !',
    html: fs.readFileSync(__dirname + "\\assets\\email\\verification.html", "utf8").replace("{{first_number}}", first_number).replace("{{second_number}}", second_number).replace("{{username}}", user.username)
  };

  transporter.sendMail(message, (error: any, info: any) => {
    if (error) {
      console.log('Error occurred');
      console.log(error.message);
      return process.exit(1);
    }
    cb("Verification's message sent.");
    var userz: any = user;
    userz.code = first_number + second_number;
    verification_mail_sent.set(user.email, userz);
    transporter.close();
  });
}

export function verifyVerification(email: string, code: string, cb: any) {
  if (!verification_mail_sent.has(email)) return cb(errors.no_verification_code_in_pending);
  if (code !== verification_mail_sent.get(email) ?.code) {
    verification_mail_sent.delete(email);
    return cb(errors.invalid_code);
  }
  sql.register(verification_mail_sent.get(email), (message: string) => cb(message));
}
