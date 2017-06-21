var express = require('express');
var app = express();
var mysql = require('mysql');
var cors = require('cors'); //跨域功能
var bodyParser = require('body-parser'); //引入请求体的解析包
var multiparty = require('multiparty'); //图片等文件上传
var path = require('path');
var fs = require("fs")
var mv = require('mv');
var util = require("util")
const secret =  fs.readFileSync("publicKey.txt",'utf-8');
app.use(cors())
app.use(bodyParser.json()); //解析中间件，并获取前端传来的数据
const mysqlConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'cert',
  port: '3306'
};
var jwt = require("jwt-simple");

var moment = require('moment');
//生成token
function token(payload) {
  let token = jwt.encode(payload, secret);
  let decode = jwt.decode(token, secret);
  return token;
}

function checkToken(token) {
  let decode = jwt.decode(token, secret);
  let now = moment().valueOf()
  console.log(now,decode.time)
  if (now <= decode.time) {
    return true
  } else {
    return false
  }
}

function decodeToken(token) {
  let decode = jwt.decode(token, secret);
  return decode;
}
//密码加密
function encipher() {

}
app.post("/isLogin", function (req, res) {
  if (checkToken(req.body.token)) {
    let userName = decodeToken(req.body.token)
    userName = userName.username
    res.json({
      status: 200,
      token: req.body.token,
      name: userName
    })
  }
})
//登录操作
console.log(moment().format())
app.post('/login', function (req, res) {
  console.log(req.body);
  let userName = req.body.username;
  let getPwd = req.body.password;
  let realPwd;
  let connection = mysql.createConnection(mysqlConfig);
  //查询
  if (userName) {
    connection.connect();
    connection.query('SELECT user_pwd FROM `user` WHERE user_id = \'' + userName + '\'', function (err, rows, fields) {
      if (err) throw err;
      realPwd = rows[0].user_pwd;
      console.log('查询结果为: ', rows[0].user_pwd);
      if (realPwd == getPwd) {
        let tokens = token({
          username: userName,
          pass: getPwd,
          time: req.body.time
        })
        res.json({
          token: tokens,
          name: userName,
          status: 200
        });
      } else {
        res.json({
          status: 404
        });
      }
    }); //异步，要使用Promise
    connection.end();
  }
});
//注册操作
app.post('/register', (req, res) => {

});
//名人堂操作
app.post('/famous', (req, res) => {
  var form = new multiparty.Form();
  //   form.parse(req, function (err, fields, files) {
  //      console.log(JSON.stringify(files, null, 2));
  //   });
  //上传完成后处理
  form.parse(req, function (err, fields, files) {
    console.log(fields)
    var filesTmp = JSON.stringify(files, null, 2);
    if (err) {
      console.log('parse error: ' + err);
    } else {
      console.log('parse files: ' + filesTmp);
      if (checkToken(fields.token[0])) {
        var inputFile = files.file[0];
        var uploadedPath = inputFile.path;
        var dstPath = './files/' + inputFile.originalFilename;
        let addName = fields.addName[0];
        let addInfo = fields.addInfo[0];
        let addDescribe = fields.addDescribe[0];
        let addSrc = "http://localhost:3000/img/" + inputFile.originalFilename;

        // 重命名为真实文件名
        mv(uploadedPath, dstPath, function (err) {
          if (err) {
            throw err;
          }
          console.log('file moved successfully');
        });
        let connection = mysql.createConnection(mysqlConfig);
        //查询
        connection.connect();
        let data = '\'{"name":\"' + addName + '\","info":\"' + addInfo + '\","src":\"' + addSrc + '\","describle":\"' + addDescribe + '\"}\'';
        let syx = 'INSERT INTO `famous` (`famous_id`, `famous_item`) VALUES (NULL,' + data + ')';
        connection.query(syx, function (err, rows, fields) {
          if (err) throw err;
          console.log('查询结果为: ', fields);

        }); //异步，要使用Promise
        connection.end();
        res.writeHead(200, {
          'content-type': 'text/plain;charset=utf-8'
        });
        res.write('received upload:\n\n');
        res.end(util.inspect({
          fields: fields,
          files: filesTmp
        }));
      } else {
        res.json({
          status: 404,
          message: "token验证失败"
        })
      }

    }

  });


});
app.get('/famous', function (req, res) {
  if (checkToken(req.query.token)) {
    let connection = mysql.createConnection(mysqlConfig);
    //查询
    connection.connect();
    connection.query('SELECT * FROM `famous`', function (err, rows, fields) {
      if (err) throw err;
      console.log('查询结果为: ', rows);
      let famousMessage = [];
      rows.forEach(function (element) {
        element.famous_item = JSON.parse(element.famous_item)

        element.famous_item.num = element.famous_id

        famousMessage.push(element.famous_item)
      }, this);
      res.json({
        data: famousMessage,
        status: 200
      })
    }); //异步，要使用Promise
    connection.end();
  } else {
    res.json({
      status: 404,
      message: "token验证失败"
    })
  }


});
app.patch("/famous", (req, res) => {
  if (checkToken(req.body.token)) {
    let deleteID = req.body.data;
    let connection = mysql.createConnection(mysqlConfig);
    //查询
    console.log(req.body)
    connection.connect();
    connection.query('DELETE FROM `famous` WHERE `famous`.`famous_id` = \'' + deleteID + '\'', function (err, rows, fields) {
      if (err) throw err;
      console.log("删除成功")
      res.json({
        status: 200
      })
    });
    connection.end();
  } else {
    res.json({
      status: 404,
      message: "token验证失败"
    })
  }
});

//照片集操作

app.post('/photo', () => {

});
app.get('/photo', () => {

});
app.delete("/photo", () => {

});
//作品集操作
app.post('/works', () => {

});
app.get('/works', () => {

});
app.delete("/works", () => {

});
app.get('/img/:filename', function (req, res) {
  var filePath = path.join('./files/', req.params.filename);
  fs.exists(filePath, function (exists) {
    res.sendfile(filePath);
  });
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
