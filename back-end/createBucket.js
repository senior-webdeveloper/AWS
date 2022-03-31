const AWS = require("aws-sdk");
const ID = "AKIAQTY6TUMPGPWGU53F";
const SECRET = "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";
const BUCKET_NAME = "news-attachment";

const s3 = new AWS.S3({
  accessKeyId: ID,
  secretAccessKey: SECRET,
});

const params = {
  Bucket: BUCKET_NAME,
  CreateBucketConfiguration: {
    // Set your region here
    LocationConstraint: "eu-east-1",
  },
};

s3.createBucket(params, function (err, data) {
  if (err) console.log(err, err.stack);
  else console.log("Bucket Created Successfully", data.Location);
});
