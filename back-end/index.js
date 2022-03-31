const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const app = express();
let async = require("async");

//use cors to allow cross origin resource sharing
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// AWS

let uuid = require("uuid");
const fs = require("fs");
const multiparty = require("multiparty");

let AWS = require("aws-sdk");
AWS.config.loadFromPath("./config.json");
AWS.config.update({ region: "us-east-1" });

let docClient = new AWS.DynamoDB.DocumentClient();
let table = "news_item";
let channelTable = "channel";

// aws s3 data

const ID = "AKIAQTY6TUMPGPWGU53F";
const SECRET = "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";
const BUCKET_NAME = "attachmentbucket";

/**
 * Copyright 2010-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *      News CRUD
 *
 */

// get file url

const getFileUrl = (myKey) => {
  const s3 = new AWS.S3();
  AWS.config.update({ accessKeyId: ID, secretAccessKey: SECRET });

  const myBucket = "attachmentbucket";
  const signedUrlExpireSeconds = 60 * 5; // your expiry time in seconds.

  const url = s3.getSignedUrl("getObject", {
    Bucket: myBucket,
    Key: myKey,
    Expires: signedUrlExpireSeconds,
  });
  return url;
};

// get channelName

const getChannelName = async (myKey) => {
  let channel_id = String(myKey);
  let dynamodb = new AWS.DynamoDB();

  let params = {
    TableName: channelTable,
    Key: {
      id: { S: channel_id },
      sortkey: { S: "1" },
    },
  };
  let result = await dynamodb.getItem(params).promise();

  return Object.entries(result).length !== 0 ? result.Item.channelName.S : "";
};

// load the item

app.get("/get", function (req, res) {
  let params = {
    TableName: table,
  };
  docClient.scan(params).eachPage(async (err, data, done) => {
    if (data != null) {
      let item = data.Items;
      for (let key in item) {
        const channel = await getChannelName(item[key].channel_id);
        item[key].channel = channel;
        const url = getFileUrl(item[key].attachment);
        item[key].url = url;
      }
      res.send(item);
    }
    done();
  });
});

// create the item

app.post("/create", (req, res) => {
  const form = new multiparty.Form();

  form.parse(req, async (error, fields, files) => {
    const { title, content, attachment, expiration_date, channel_id } = fields;

    let id = uuid.v1();
    let datetime = new Date().toLocaleString();

    const s3 = new AWS.S3({
      accessKeyId: ID,
      secretAccessKey: SECRET,
    });
    // Read content from the file
    const fileContent = fs.createReadStream(files.file[0].path);
    const fileName = files.file[0].originalFilename;
    // Setting up S3 upload parameters
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName, // File name you want to save as in S3
      Body: fileContent,
    };

    // Uploading files to the bucket
    s3.upload(uploadParams, function (err, data) {
      if (err) {
        throw err;
      }
      console.log(`File uploaded successfully. ${JSON.stringify(data)}`);
    });

    //  adding

    console.log("Adding a new item...");
    let newsParams = {
      TableName: table,
      Item: {
        id: id,
        title: title,
        content: content,
        attachment: fileName,
        expiration_date: expiration_date,
        entered_date: datetime,
        url: null,
        channel_id: channel_id,
        sortkey: "1",
      },
    };
    docClient.put(newsParams, async function (err, data) {
      if (err) {
        console.error(
          "Unable to add item. Error JSON:",
          JSON.stringify(err, null, 2)
        );
      } else {
        console.log("Added item:", JSON.stringify(data, null, 2));

        const fileUrl = getFileUrl(fileName);
        const channelName = await getChannelName(channel_id);

        res.send({
          id: id,
          channelName: channelName,
          datetime: datetime,
          fileUrl: fileUrl,
          attachment: fileName,
        });
      }
    });
  });
});

// Update the item, unconditionally,

app.post("/update", function (req, res) {
  const { id, title, content, channel_id, expiration_date } = req.body;
  let params = {
    TableName: table,
    Key: {
      id: id,
      sortkey: "1",
    },
    UpdateExpression:
      "set title = :t,content = :c,channel_id = :ch,expiration_date = :e",
    ExpressionAttributeValues: {
      ":t": title,
      ":c": content,
      ":e": expiration_date,
      ":ch": channel_id,
    },
    ReturnValues: "UPDATED_NEW",
  };

  console.log("Updating the item...");
  docClient.update(params, function (err, data) {
    if (err) {
      console.error(
        "Unable to update item. Error JSON:",
        JSON.stringify(err, null, 2)
      );
    } else {
      console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
      res.send("success");
    }
  });
});

// delete the item

app.get("/delete", function (req, res) {
  let deleteId = req.query.deleteId;
  let key = req.query.key;

  let params = {
    TableName: table,
    Key: {
      id: deleteId,
      sortkey: "1",
    },
    ConditionExpression: "id = :val",
    ExpressionAttributeValues: {
      ":val": deleteId,
    },
  };

  //  file delete

  const s3 = new AWS.S3({
    accessKeyId: ID,
    secretAccessKey: SECRET,
    Bucket: BUCKET_NAME,
  });

  s3.deleteObject({ Bucket: BUCKET_NAME, Key: key }, (err, data) => {
    console.error(err);
  });

  console.log("Attempting a conditional delete...");
  docClient.delete(params, function (err, data) {
    if (err) {
      console.error(
        "Unable to delete item. Error JSON:",
        JSON.stringify(err, null, 2)
      );
    } else {
      console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
      res.send("success");
    }
  });
});

/**
 * Copyright 2010-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *      Channel CRUD
 *
 */

// load the item

app.get("/getCh", function (req, res) {
  let params = {
    TableName: channelTable,
  };
  let count = 0;
  let news = [];

  docClient.scan(params).eachPage((err, data, done) => {
    if (data != null) {
      item = data.Items;

      res.send(item);
    }
    done();
  });
});

// create the item

app.post("/createCh", (req, res) => {
  const { channelName } = req.body;

  let id = uuid.v1();
  //  adding
  console.log("Adding a new item...");

  let newsParams = {
    TableName: channelTable,
    Item: {
      id: id,
      channelName: channelName,
      sortkey: "1",
    },
  };
  docClient.put(newsParams, function (err, data) {
    if (err) {
      console.error(
        "Unable to add item. Error JSON:",
        JSON.stringify(err, null, 2)
      );
    } else {
      console.log("Added item:", JSON.stringify(data, null, 2));

      res.send({ id: id });
    }
  });
});

// Update the item, unconditionally,

app.post("/updateCh", function (req, res) {
  const { id, channelName } = req.body;
  let params = {
    TableName: channelTable,
    Key: {
      id: id,
      sortkey: "1",
    },
    UpdateExpression: "set channelName = :n",
    ExpressionAttributeValues: {
      ":n": channelName,
    },
    ReturnValues: "UPDATED_NEW",
  };

  console.log("Updating the item...");
  docClient.update(params, function (err, data) {
    if (err) {
      console.error(
        "Unable to update item. Error JSON:",
        JSON.stringify(err, null, 2)
      );
    } else {
      console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
      res.send("success");
    }
  });
});

// delete the item

app.get("/deleteCh", function (req, res) {
  let deleteId = req.query.deleteId;

  let params = {
    TableName: channelTable,
    Key: {
      id: deleteId,
      sortkey: "1",
    },
    ConditionExpression: "id = :val",
    ExpressionAttributeValues: {
      ":val": deleteId,
    },
  };

  console.log("Attempting a conditional delete...");
  docClient.delete(params, function (err, data) {
    if (err) {
      console.error(
        "Unable to delete item. Error JSON:",
        JSON.stringify(err, null, 2)
      );
    } else {
      console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
      res.send("success");
    }
  });
});

//start your server on port 3001
app.listen(3001, () => {
  console.log("Server Listening on port 3001");
});
