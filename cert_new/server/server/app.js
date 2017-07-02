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
const secret = fs.readFileSync("publicKey.txt", 'utf-8');
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
let login = require("./login.js")
app.post('/login', [login.post]);

//名人堂操作
let famous = require("./famous.js");
app.post('/famous', [famous.post]);
app.get('/famous', [famous.get]);
app.patch("/famous", [famous.patch]);

//照片集操作
let photo = require("./photo.js");
app.post('/photo', [photo.post]);
app.get('/photo', [photo.get]);
app.patch("/photo", [photo.patch]);
//作品集操作
let works = require("./works.js");
app.post('/works', [works.post]);
app.get('/works', [works.get]);
app.patch("/works", [works.pacth]);

app.get('/img/:filename', function (req, res) {
  var filePath = path.join('./files/', req.params.filename);
  fs.exists(filePath, function (exists) {
    res.sendfile(filePath);
  });
});

let fresh = require("./fresh.js")
app.post("/fresh", [fresh.post])
app.get("/fresh", [fresh.get]);
app.patch("/fresh", [fresh.patch])

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
