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

  bulkCommands.length = 0;
  lastOperationsIds.length = 0;
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

  const notSynchronizedOperationsDocuments = await customersAuditCollection
    .find({ synchronized: false })
    .toArray();

  notSynchronizedOperationsDocuments.forEach((document) => {
    const operation: IMongodbOperationInfo = document.operation;
    const bulkCommand = createBulkCommandByOperation(operation);
    if (bulkCommand) {
      bulkCommandsArray.push(bulkCommand);
      notSynchronizedOperationsIdsArray.push(operation._id._data);
    }
  });

  let bulkCommandsArray: Array<any> = [];
  let notSynchronizedOperationsIdsArray: Array<string> = [];

  customersCollection
    .watch()
    .on("change", async (operation: IMongodbOperationInfo) => {
      log({ operation });

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
}

start();
