const crypto = require('crypto');
const uWS = require('uWebSockets.js');

const port = 9001;

var mysql = require('mysql');
var connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'root',
  database: 'user'
});

connection.connect();

const app = uWS./*SSL*/App({
  key_file_name: 'misc/key.pem',
  cert_file_name: 'misc/cert.pem',
  passphrase: '1234'
}).get('/user/list', (res: any, req: any) => {
  connection.query({
    sql: 'SELECT * FROM `user`;'
  },
  function(error: any, results: any, fields: any) {
    if (error) {
      console.log(error);
    }
    res.end(""+results.map((x:any) => x.username).join(" "));
  });
  res.onAborted(() => {
    res.end("erreur")
  });
})
.post('/user/login', (res: any, req: any) => {
  let url = req.getUrl();

  readJson(res, (obj:any) => {
    if(obj.username && obj.password) {
      let hash = crypto.createHash('sha256').update(obj.password).digest('base64');
      connection.query("SELECT * FROM user where username = ? limit 1",[obj.username], function (err:any, result:any) {
        if(err) console.log(err);
        if(result[0].password === hash) {
          res.end("Bon mot de passe.");
        } else {
          res.end("Mauvais mot de passe.");
        }
      })

    } else {
      res.end("Des datas sont manquantes.");
    }
  }, () => {
    console.log('JSON invalide ou aucune donnée.');
  });
})
.post('/user/register', (res: any, req: any) => {
  let url = req.getUrl();

  readJson(res, (obj:any) => {
    if(obj.username && obj.password && obj.email) {
      let hash = crypto.createHash('sha256').update(obj.password).digest('base64');
      connection.query("INSERT INTO user (userName, password, email) VALUES (?)",[[obj.username,hash,obj.email]], function (err:any, result:any) {
        if(err) console.log(err);
        res.end("Gg !");
      })

    } else {
      res.end("Des datas sont manquantes.");
    }
  }, () => {
    console.log('JSON invalide ou aucune donnée.');
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
function readJson(res:any, cb:any, err:any) {
  let buffer:any;
  res.onData((ab:any, isLast:any) => {
    let chunk = Buffer.from(ab);
    if (isLast) {
      let json:any;
      if (buffer) {
        try {
          json = JSON.parse(Buffer.concat([buffer, chunk]).toString());
        } catch (e:any) {
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
