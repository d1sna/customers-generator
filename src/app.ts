import mongoose from "mongoose";
import connectToMongoDb from "./lib/connect-to-mongodb";
import { getMongodbUriFromEnv } from "./lib/get-mongodb-uri-from-env";
import { CUSTOMERS_COLLECTION_NAME } from "./lib/constants";

import { getRandomNumberFromInterval } from "./lib/get-random-number-from-interval";
import { generateCustomer } from "./lib/generate-customer";

async function start() {
  const mongoUri = getMongodbUriFromEnv();
  await connectToMongoDb(mongoUri);

  const customersCollection = mongoose.connection.collection(
    CUSTOMERS_COLLECTION_NAME
  );

  setInterval(async () => {
    const randomNumberFromOneToTen: number = getRandomNumberFromInterval(1, 10);
    const generatedCustomers: Array<object> = [];

    for (let i = 0; i <= randomNumberFromOneToTen; i++) {
      const generatedCustomer = generateCustomer();
      generatedCustomers.push(generatedCustomer);
    }

    await customersCollection.insertMany(generatedCustomers);
  }, 200);
}

start();
