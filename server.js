const express = require("express");
const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 5001;

require("dotenv").config();

const AwsSecretAccessKey = process.env.AWS_SECRET_KEY;
const AwsAccessKeyId = process.env.AWS_ACCESS_KEY;
const AwsBucketName = process.env.AWS_BUCKET_NAME;
const AwsBucketRegion = process.env.AWS_BUCKET_REGION;

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Home EJS Routes
app.get("/", (req, res) => {
  res.render("homeS3");
});

// Configure AWS
aws.config.update({
  secretAccessKey: AwsSecretAccessKey,
  accessKeyId: AwsAccessKeyId,
  region: AwsBucketRegion,
});

const s3 = new aws.S3();

// Configure Multer to use S3 for storage
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: AwsBucketName,
    acl: "public-read",
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + "-" + file.originalname);
    },
  }),
});

// Upload a single file
app.post(
  "/upload",
  upload.fields([{ name: "profileImage" }, { name: "CoverImage" }]),

  function (req, res) {
    res.send({
      message: "File uploaded successfully",
      fileUrl: req.files.location,
      key: req.files.originalname,
    });
  }
);

// List all files
app.get("/files", (req, res) => {
  let BucketName = AwsBucketName;
  const params = {
    Bucket: BucketName,
  };

  s3.listObjects(params, function (err, data) {
    if (err) {
      return res.status(500).send(err);
    }
    res.send(data);
  });
});

app.get("/media", (req, res) => {
  const bucketName = AwsBucketName;
  const params = {
    Bucket: bucketName,
  };

  s3.listObjectsV2(params, function (err, data) {
    if (err) {
      console.log("Error fetching from S3:", err);
      return res.status(500).send("Error fetching from S3");
    }
    // Create an array of image objects with URL, name, and last modified date
    let images = data.Contents.map((file) => ({
      url: `https://${bucketName}.s3.amazonaws.com/${file.Key}`,
      name: file.Key,
      lastModified: file.LastModified,
    }));
    // console.log(images);
    // Sort images by last modified date
    images.sort((a, b) => b.lastModified - a.lastModified);

    // Render the EJS template and pass the sorted images array
    res.render("media", { images: images });
  });
});

app.post("/delete-image", (req, res) => {
  const params = {
    Bucket: AwsBucketName,
    Key: req.body.key,
  };

  s3.deleteObject(params, (err, data) => {
    if (err) {
      console.log(err, err.stack);
      return res.status(500).send("Failed to delete image");
    }
    res.redirect("/media"); // Redirect back to the gallery page
  });
});

// Delete a file
app.delete("/files/:fileName", (req, res) => {
  let s3Key = req.query.key;
  const params = {
    Bucket: AwsBucketName,
    Key: s3Key,
  };

  s3.deleteObject(params, function (err, data) {
    if (err) {
      console.log(err, err.stack); // an error occurred
      res.status(500).send({ error: "Failed to delete file", details: err });
    } else {
      console.log("File deleted successfully"); // successful response
      res.send({ message: "File deleted successfully", data: data });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
