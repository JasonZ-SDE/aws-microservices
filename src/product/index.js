"use strict";
import {
  DeleteItemCommand,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ddbclient } from "./ddbClient";
import { v4 as uuidv4 } from "uuid";

exports.handler = async function (event) {
  console.log("request:", JSON.stringify(event, undefined, 2));
  let body = {};
  try {
    switch (event.httpMethod) {
      case "GET":
        if (event.queryStringParameters != null) {
          body = await getProductsByCategory(event);
        } else if (event.pathParameters != null) {
          body = await getProduct(event.pathParameters.id);
        } else {
          body = await getAllProducts();
        }
        break;
      case "POST":
        body = await createProduct(event);
        break;
      case "DELETE":
        body = await deleteProduct(event.pathParameters.id);
        break;
      case "PUT":
        body = await updateProduct(event);
        break;
      default:
        throw new Error(`Unsupported route: "${event.httpMethod}"`);
    }

    console.log(body);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully finished operation: "${event.httpMethod}"`,
        body: body,
      }),
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to perform operation",
        errorMsg: e.message,
        errorStack: e.stack,
      }),
    };
  }
};

const getProduct = async (productId) => {
  console.log("getProduct");
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      key: marshall({ id: productId }),
    };

    const { Item } = await ddbclient.send(new GetItemCommand(params));
    console.log(Item);
    return Item ? unmarshall(Item) : {};
  } catch (e) {
    console.log(e);
    throw e;
  }
};

const getAllProducts = async () => {
  console.log("getAllProducts");
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
    };

    const { Items } = await ddbclient.send(new ScanCommand(params));
    console.log(Items);
    return Items ? Items.map((item) => unmarshall(item)) : {};
  } catch (e) {
    console.log(e);
    throw e;
  }
};

const createProduct = async (event) => {
  console.log(`createProduct function. event "${event}"`);
  try {
    const productRequest = JSON.parse(event.body);
    const productId = uuidv4();
    productRequest.id = productId;
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(productRequest || {}),
    };
    const createResult = await ddbclient.send(new PutItemCommand(params));

    console.log(createResult);
    return createResult;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

const deleteProduct = async (productId) => {
  console.log(`deleteProduct function. productId: "${prodcutId}"`);

  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      key: marshall({ id: productId }),
    };

    const deleteResult = await ddbclient.send(new DeleteItemCommand(params));
    console.log(deleteResult);
    return deleteResult;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

const updateProduct = async (event) => {
  console.log(`updateProduct function. event "${event}"`);

  try {
    const requestBody = JSON.parse(event.body);
    const objKeys = Object.keys(requestBody);
    console.log(
      `updateProduct function. requestBody : "${requestBody}", objKeys: "${objKeys}"`
    );

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ id: event.pathParameters.id }),
      UpdateExpression: `SET ${objKeys
        .map((_, index) => `#key${index} = :value${index}`)
        .join(", ")}`,
      ExpressionAttributeNames: objKeys.reduce(
        (acc, key, index) => ({
          ...acc,
          [`#key${index}`]: key,
        }),
        {}
      ),
      ExpressionAttributeValues: marshall(
        objKeys.reduce(
          (acc, key, index) => ({
            ...acc,
            [`:value${index}`]: requestBody[key],
          }),
          {}
        )
      ),
    };

    const updateResult = await ddbclient.send(new UpdateItemCommand(params));
    console.log(updateResult);
    return updateResult;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

const getProductsByCategory = async (event) => {
  console.log("getProductsByCategory");
  try {
    // GET product/1234?category=Phone
    const productId = event.pathParameters.id;
    const category = event.queryStringParameters.category;

    const params = {
      KeyConditionExpression: "id = :productId",
      FilterExpression: "contains (category, :category)",
      ExpressionAttributeValues: {
        ":productId": { S: productId },
        ":category": { S: category },
      },
      TableName: process.env.DYNAMODB_TABLE_NAME,
    };

    const { Items } = await ddbClient.send(new QueryCommand(params));

    console.log(Items);
    return Items.map((item) => unmarshall(item));
  } catch (e) {
    console.error(e);
    throw e;
  }
};
