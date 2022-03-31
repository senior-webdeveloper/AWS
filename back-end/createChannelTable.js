/**
 * Copyright 2010-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * This file is licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License. A copy of
 * the License is located at
 *
 * http://aws.amazon.com/apache2.0/
 *
 * This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */
var AWS = require("aws-sdk");

AWS.config.loadFromPath('./config.json');
AWS.config.update({ region: 'us-east-1' });
var dynamodb = new AWS.DynamoDB();

var params = {
    TableName: "channel",
    KeySchema: [
        { AttributeName: "id", KeyType: "HASH" }, //Partition key
        { AttributeName: "sortkey", KeyType: "RANGE" } //Sort key
    ],
    AttributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "sortkey", AttributeType: "S" }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 1000,
        WriteCapacityUnits: 1000
    }
};


dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});