const uWS = require('uWebSockets.js');
import * as email from "./email";
import * as sql from "./sql"
import { userSimple, userLogin } from "./interfaces/user";

const errors = require("../config/errors.json");

const dotenv = require('dotenv');
dotenv.config();

const port = 9001;

const app = uWS./*SSL*/App({
  key_file_name: 'misc/key.pem',
  cert_file_name: 'misc/cert.pem',
  passphrase: '1234'
}).get('/user/list', (res: any, req: any) => {
  sql.listOfUsers((list: string) => {
    res.end(list);
  });
  res.onAborted(() => {
    res.end(errors.responses_aborted)
  });
})
  .post('/user/login', (res: any, req: any) => {
    readJson(res, (obj: userLogin) => {
      if (obj.username && obj.password) {
        sql.login(obj, (message: String) => res.end(message))
      } else {
        res.end(errors.no_all_data);
      }
    }, () => {
      console.log(errors.invalid_json);
    });
  })
  .post('/user/register', (res: any, req: any) => {
    readJson(res, (obj: any) => {
      if (obj.username && obj.password && obj.email) {
        sql.preRegistration(obj, (message: string) => res.end(message))
      } else {
        res.end(errors.no_all_data);
      }
    }, () => {
      console.log(errors.invalid_json);
    });
  })
  .post("/user/register/code", (res: any, req: any) => {
    readJson(res, (obj: any) => {
      email.verifyVerification(obj.email, obj.code, (message: string) => res.end(message));
    }, () => {
      console.log(errors.invalid_json);
    });
  })
  .listen(port, (token: any) => {
    if (token) {
      console.log('Listening to port ' + port);
    } else {
      console.log('Failed to listen to port ' + port);
    }
  });

// see https://github.com/uNetworking/uWebSockets.js/blob/master/examples/JsonPost.js
function readJson(res: any, cb: any, err: any) {
  let buffer: any;
  res.onData((ab: any, isLast: any) => {
    let chunk = Buffer.from(ab);
    if (isLast) {
      let json: any;
      if (buffer) {
        try {
          json = JSON.parse(Buffer.concat([buffer, chunk]).toString());
        } catch (e: any) {
          res.close();
          return;
        }
        cb(json);
      } else {
        try {
          json = JSON.parse(chunk.toString());
        } catch (e) {
          res.close();
          return;
        }
        cb(json);
      }
    } else {
      if (buffer) {
        buffer = Buffer.concat([buffer, chunk]);
      } else {
        buffer = Buffer.concat([chunk]);
      }
    }
  });
  res.onAborted(err);
}
