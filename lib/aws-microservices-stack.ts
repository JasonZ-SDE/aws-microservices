import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { SwnApiGateway } from "./apigateway";
import { SwnDatabase } from "./database";
import { SwnEventBus } from "./eventBus";
import { SwnMicroservices } from "./microservice";

export class AwsMicroservicesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const database = new SwnDatabase(this, "Database");

    const microservices = new SwnMicroservices(this, "Microservices", {
      productTable: database.productTable,
      basketTable: database.basketTable,
      orderTable: database.orderTable,
    });

    const apigateway = new SwnApiGateway(this, "ApiGateway", {
      productMicroservice: microservices.productMicroservice,
      basketMicroservice: microservices.basketMicroservice,
      orderMicroservice: microservices.orderMicroservice,
    });

    const eventBus = new SwnEventBus(this, "EventBus", {
      publisherFunction: microservices.basketMicroservice,
      targetFunction: microservices.orderMicroservice,
    });
  }
}
