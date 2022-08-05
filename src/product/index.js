import {
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import ddbclient from "./ddbClient";
import { v4 as uuidv4 } from "uuid";

exports.handler = async function (event) {
  console.log("request:", JSON.stringify(event, undefined, 2));

  // TODO: Switch cases event.httpMethod to perform CRUD oprations using DDB obj.
  switch (event.httpMethod) {
    case "GET":
      if (event.pathParameters != null) {
        body = await getProduct(event.pathParameters.id);
      } else {
        body = await getAllProducts();
      }
    case "PUT":
      body = await createProduct(event);
    default:
      throw new Error(`Unsupported route: "${event.httpMethod}"`);
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: `Hello from Product! You've hit ${event.path}\n`,
  };
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
    return Item ? unmarshall(item) : {};
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
    const productRequest = JSON.parse(event);
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
