const express = require("express");
const path = require("path");
const app = express();
const PORT = 5000;
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },

  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Home EJS Routes
app.get("/", (req, res) => {
  res.render("home");
});

// File Upload Route
app.post(
  "/upload",
  upload.fields([{ name: "profileImage" }, { name: "CoverImage" }]),
  function (req, res, next) {
    console.log(req.body);
    console.log(req.files);
    return res.redirect("/");
  }
);

app.listen(PORT, () => {
  console.log(`Server is Running at ${PORT}`);
});
