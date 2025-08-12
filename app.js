var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session = require("express-session"); // 新增：引入 session 模块
const cors = require("cors");
// var indexRouter = require("./routes/index");
// var usersRouter = require("./routes/users");

var app = express();
app.use(
  session({
    secret: "your_secret_key", // 用于签名 Cookie（必须设置）
    resave: false, // 强制保存会话，即使未修改（建议 false）
    saveUninitialized: true, // 强制保存未初始化的会话（建议 true）
    cookie: {
      httpOnly: true, // 防止 XSS
      secure: false, // 开发环境设为 false，生产环境设为 true（需 HTTPS）
      maxAge: 30 * 60 * 1000, // 会话过期时间（30 分钟）
    },
  })
);
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// 只保留一个路由入口
var mainRouter = require("./routes/routerAll"); // 引入统一路由
// app.use("/", indexRouter);
// app.use("/users", usersRouter);
app.use(mainRouter);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
