import mongoose from "mongoose";
import connectToMongoDb from "./lib/connect-to-mongodb";
import {
  CUSTOMERS_ANONYMIZED_COLLECTION_NAME,
  CUSTOMERS_AUDIT_COLLECTION_NAME,
  CUSTOMERS_COLLECTION_NAME,
} from "./lib/constants";
import { getMongodbUriFromEnv } from "./lib/get-mongodb-uri-from-env";
import IMongodbOperationInfo from "./interfaces/mongodb-operation-info.interface";
import { log } from "console";

import anonymizeCustomerFields from "./lib/anonymize-customer-fields";
import { ICustomerFields } from "./interfaces/customer-fields.interface";

//----------------------------------------------------------------------------------------------------------------//
function createBulkCommandByOperation(operation: IMongodbOperationInfo) {
  const { operationType, fullDocument, updateDescription, documentKey } =
    operation;
  let anonymizedCustomerFields: ICustomerFields | null = null;

  if (operationType === "insert") {
    anonymizedCustomerFields = anonymizeCustomerFields(fullDocument);
  }

  if (operationType === "update") {
    anonymizedCustomerFields = anonymizeCustomerFields({
      ...documentKey,
      ...updateDescription.updatedFields,
    });
  }

  if (!anonymizedCustomerFields) return;

  return {
    updateOne: {
      filter: { _id: anonymizedCustomerFields._id },
      update: { $set: anonymizedCustomerFields },
      upsert: true,
    },
  };
}

//----------------------------------------------------------------------------------------------------------------//
async function executeSynchronization(
  bulkCommands: any[],
  lastOperationsIds: string[],
  customersAnonymizedCollection: mongoose.Collection,
  customersAuditCollection: mongoose.Collection
) {
  if (!bulkCommands.length) return;

  const session: mongoose.ClientSession = await mongoose.startSession();
  await customersAnonymizedCollection.bulkWrite(bulkCommands, { session });
  await customersAuditCollection.updateMany(
    {
      "operation._id._data": { $in: lastOperationsIds },
    },
    { $set: { synchronized: true } },
    { session }
  );
  await session.endSession();

  log("> SYNCHRONIZED DOCUMENTS BATCH :", bulkCommands.length);
  bulkCommands.length = 0;
  lastOperationsIds.length = 0;
}

//----------------------------------------------------------------------------------------------------------------//
async function executeFullSynchronization(
  customersCollection: mongoose.Collection,
  customersAnonymizedCollection: mongoose.Collection,
  customersAuditCollection: mongoose.Collection
) {
  const allCustomers = (await customersCollection
    .find()
    .toArray()) as ICustomerFields[];
  const anonymizedCustomers = allCustomers.map(anonymizeCustomerFields);

  const bulkCommands = anonymizedCustomers.map((anonymizedCustomer) => ({
    updateOne: {
      filter: { _id: anonymizedCustomer._id },
      update: { $set: anonymizedCustomer },
      upsert: true,
    },
  }));

  await customersAnonymizedCollection.bulkWrite(bulkCommands);
  await customersAuditCollection.updateMany(
    {},
    { $set: { synchronized: true } }
  );

  log("> FULL SYNCHRONIZATION COMPLETE");
}

//----------------------------------------------------------------------------------------------------------------//
async function start() {
  const mongoUri = getMongodbUriFromEnv();
  await connectToMongoDb(mongoUri);

  const customersAuditCollection = mongoose.connection.collection(
    CUSTOMERS_AUDIT_COLLECTION_NAME
  );
  const customersCollection = mongoose.connection.collection(
    CUSTOMERS_COLLECTION_NAME
  );
  const customersAnonymizedCollection = mongoose.connection.collection(
    CUSTOMERS_ANONYMIZED_COLLECTION_NAME
  );

  const args = process.argv.slice(2);

  let bulkCommandsArray: Array<any> = [];
  let notSynchronizedOperationsIdsArray: Array<string> = [];

  if (args.includes("--full-reindex")) {
    await executeFullSynchronization(
      customersCollection,
      customersAnonymizedCollection,
      customersAuditCollection
    );
    process.exit(0);
  }

  const notSynchronizedOperationsDocuments = await customersAuditCollection
    .find({ synchronized: false })
    .toArray();
  log("> FOUND MISSED OPERATIONS :", notSynchronizedOperationsDocuments.length);

  notSynchronizedOperationsDocuments.forEach((document) => {
    const operation: IMongodbOperationInfo = document.operation;
    const bulkCommand = createBulkCommandByOperation(operation);
    if (bulkCommand) {
      bulkCommandsArray.push(bulkCommand);
      notSynchronizedOperationsIdsArray.push(operation._id._data);
    }
  });

  customersCollection
    .watch()
    .on("change", async (operation: IMongodbOperationInfo) => {
      if (bulkCommandsArray.length >= 1000) {
        await executeSynchronization(
          bulkCommandsArray,
          notSynchronizedOperationsIdsArray,
          customersAnonymizedCollection,
          customersAuditCollection
        );
      }

      const bulkCommand = createBulkCommandByOperation(operation);
      if (bulkCommand) {
        bulkCommandsArray.push(bulkCommand);
        notSynchronizedOperationsIdsArray.push(operation._id._data);
      }
    });

  setInterval(async () => {
    await executeSynchronization(
      bulkCommandsArray,
      notSynchronizedOperationsIdsArray,
      customersAnonymizedCollection,
      customersAuditCollection
    );
  }, 1000);
}

start();
