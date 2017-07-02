module.exports = {
  post: (req, res) => {
    var form = new multiparty.Form();
    //   form.parse(req, function (err, fields, files) {
    //      console.log(JSON.stringify(files, null, 2));
    //   });
    //上传完成后处理
    form.parse(req, function (err, fields, files) {

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


  },
  get: (req, res) => {
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


  },
  patch: (req, res) => {
    if (checkToken(req.body.token)) {
      let deleteID = req.body.data;
      let connection = mysql.createConnection(mysqlConfig);
      //查询

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
  }
}
