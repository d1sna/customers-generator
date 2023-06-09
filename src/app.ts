import mongoose from "mongoose";
import connectToMongoDb from "./lib/connect-to-mongodb";
import { getMongodbUriFromEnv } from "./lib/get-mongodb-uri-from-env";
import {
  CUSTOMERS_AUDIT_COLLECTION_NAME,
  CUSTOMERS_COLLECTION_NAME,
} from "./lib/constants";

import { getRandomNumberFromInterval } from "./lib/get-random-number-from-interval";
import { generateCustomer } from "./lib/generate-customer";
import IMongodbOperationInfo from "./interfaces/mongodb-operation-info.interface";
import { ICustomerFields } from "./interfaces/customer-fields.interface";
import { log } from "console";

async function startCustomerGeneratorApp() {
  const mongoUri = getMongodbUriFromEnv();
  await connectToMongoDb(mongoUri);

  const customersCollection = mongoose.connection.collection(
    CUSTOMERS_COLLECTION_NAME
  );
  const customersAuditCollection = mongoose.connection.collection(
    CUSTOMERS_AUDIT_COLLECTION_NAME
  );

  await customersAuditCollection.createIndex({ "operation._id.data": -1 });

  customersCollection
    .watch()
    .on("change", (operation: IMongodbOperationInfo) => {
      if (["insert", "update"].includes(operation.operationType)) {
        const currentOperation = {
          operation,
          synchronized: false,
        };
        customersAuditCollection.insertOne(currentOperation);
      }
    });

  setInterval(async () => {
    const randomNumberFromOneToTen: number = getRandomNumberFromInterval(1, 10);
    const generatedCustomers: Array<ICustomerFields> = [];

    for (let i = 0; i <= randomNumberFromOneToTen; i++) {
      const generatedCustomer = generateCustomer();
      generatedCustomers.push(generatedCustomer);
    }

    const operationResult = await customersCollection.insertMany(
      generatedCustomers
    );
    log("> CREATED CUSTOMERS :", operationResult.insertedCount);
  }, 200);
}

startCustomerGeneratorApp();
