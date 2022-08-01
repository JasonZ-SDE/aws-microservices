import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";

export class AwsMicroservicesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Product service dynamodb table
    const productTable = new Table(this, "product", {
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
      tableName: "product",
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Product service Lambda function
    const nodejsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ["aws-sdk"],
      },
      environment: {
        PRIMARY_KEY: "id",
        DYNAMODB_TABLE_NAME: productTable.tableName,
      },
      runtime: Runtime.NODEJS_16_X,
    };

    const productFunction = new NodejsFunction(this, "productLambdaFunction", {
      entry: join(__dirname, `/../src/product/index.js`),
      ...nodejsFunctionProps,
    });

    productTable.grantReadWriteData(productFunction);

    // Product service API Gateway
    // product
    // GET /product
    // POST /product
    // GET /product/{id}
    // PUT /product/{id}
    // DELETE /product/{id}

    const apigw = new LambdaRestApi(this, "productApi", {
      restApiName: "Product Service",
      handler: productFunction,
      proxy: false,
    });

    const product = apigw.root.addResource("product");
    product.addMethod("GET");
    product.addMethod("POST");

    const singleProduct = product.addResource("{id}");
    singleProduct.addMethod("GET");
    singleProduct.addMethod("PUT");
    singleProduct.addMethod("DELETE");
  }
}
