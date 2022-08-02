exports.handler = async function (event) {
  console.log("request:", JSON.stringify(event, undefined, 2));

  // TODO: Switch cases event.httpmethod to perform CRUD oprations using DDB obj.

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: `Hello from Product! You've hit ${event.path}\n`,
  };
};
