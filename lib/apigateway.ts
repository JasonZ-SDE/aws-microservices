import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface SwnApiGatewayProps {
  productMicroservice: IFunction;
  basketMicroservice: IFunction;
  orderMicroservice: IFunction;
}

export class SwnApiGateway extends Construct {
  constructor(scope: Construct, id: string, props: SwnApiGatewayProps) {
    super(scope, id);

    this.createProductApi(props.productMicroservice);
    this.createBasketApi(props.basketMicroservice);
    this.createOrderApi(props.orderMicroservice);
  }

  // Product microservice api gateway
  // root name = product

  // GET /product
  // POST /product

  // Single product with id parameter
  // GET /product/{id}
  // PUT /product/{id}
  // DELETE /product/{id}
  private createProductApi(productMicroservice: IFunction) {
    const apigw = new LambdaRestApi(this, "productApi", {
      restApiName: "Product Service",
      handler: productMicroservice,
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

  // Basket microservice api gateway
  // root name = basket
  // GET /basket
  // POST /basket

  // resource name = basket/{userName}
  // GET /basket/{userName}
  // DELETE /basket/{userName}

  // checkout baskey async flow
  // POST /basket/checkout
  private createBasketApi(basketMicroservice: IFunction) {
    const apigw = new LambdaRestApi(this, "basketApi", {
      restApiName: "Basket Service",
      handler: basketMicroservice,
      proxy: false,
    });

    const basket = apigw.root.addResource("basket");
    basket.addMethod("GET");
    basket.addMethod("POST");

    const singleBasket = basket.addResource("{userName}");
    singleBasket.addMethod("GET");
    singleBasket.addMethod("DELETE");

    const basketCheckout = basket.addResource("checkout");
    basketCheckout.addMethod("POST");
  }

  // Ordering microservices api gatemway
  // root name = order
  // GET /order
  // GET /order/{userName} -> Expect request /order/swn?orderDate=timestamp
  private createOrderApi(orderMicroservice: IFunction) {
    const apigw = new LambdaRestApi(this, "orderApi", {
      restApiName: "Order Service",
      handler: orderMicroservice,
      proxy: false,
    });

    const order = apigw.root.addResource("order");
    order.addMethod("GET");

    const singleOrder = order.addResource("{userName}");
    singleOrder.addMethod("GET");
  }
}
