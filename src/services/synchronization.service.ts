import { log } from "console";
import { get } from "lodash";
import mongoose from "mongoose";
import IMongodbOperationInfo from "../interfaces/mongodb-operation-info.interface";
import { CustomersRepository } from "../db/customers.repository";
import { CustomersAnonymizedRepository } from "../db/customers-anonymized.repository";
import { CustomersAuditRepository } from "../db/customers-audit.repository";
import anonymizeCustomerFields from "../lib/anonymize-customer-fields";
import {
  CUSTOMERS_ANONYMIZED_COLLECTION_NAME,
  CUSTOMERS_AUDIT_COLLECTION_NAME,
  CUSTOMERS_COLLECTION_NAME,
  ONE_SECOND,
} from "../lib/constants";

export class SynchronizationService {
  private customerAnonymizedDocuments: Array<any> = [];
  private notSynchronizedOperationsIds: Array<string> = [];

  constructor(
    private readonly customersRepository: CustomersRepository,
    private readonly customersAnonymizedRepository: CustomersAnonymizedRepository,
    private readonly customersAuditRepository: CustomersAuditRepository
  ) {}

  //----------------------------------------------------------------------------------------------------------------//
  public static createFromMongooseCollections() {
    const customersAuditCollection = mongoose.connection.collection(
      CUSTOMERS_AUDIT_COLLECTION_NAME
    );
    const customersCollection = mongoose.connection.collection(
      CUSTOMERS_COLLECTION_NAME
    );
    const customersAnonymizedCollection = mongoose.connection.collection(
      CUSTOMERS_ANONYMIZED_COLLECTION_NAME
    );

    return new SynchronizationService(
      new CustomersRepository(customersCollection),
      new CustomersAnonymizedRepository(customersAnonymizedCollection),
      new CustomersAuditRepository(customersAuditCollection)
    );
  }

  //----------------------------------------------------------------------------------------------------------------//
  public addListenerToCustomersChanges() {
    this.customersRepository.addChangesListener((operation) =>
      this.handleOperation(operation)
    );
  }

  //----------------------------------------------------------------------------------------------------------------//
  public async handleMissedOperations() {
    const notSynchronizedOperationsDocuments =
      await this.customersAuditRepository.findNotSynchronizedDocuments();
    log(
      "> FOUND MISSED OPERATIONS :",
      notSynchronizedOperationsDocuments.length
    );

    notSynchronizedOperationsDocuments.forEach((document) =>
      this.handleOperation(document.operation)
    );
  }

  //----------------------------------------------------------------------------------------------------------------//
  public executeSynchronizationEverySecond() {
    setInterval(async () => await this.executeSynchronization(), ONE_SECOND);
  }

  //----------------------------------------------------------------------------------------------------------------//
  public async executeSynchronization() {
    if (!this.customerAnonymizedDocuments.length) return;
    const currentCustomersAnonymizedDocuments = [
      ...this.customerAnonymizedDocuments,
    ];
    const currentNotSynchronizedOperationsIds = [
      ...this.notSynchronizedOperationsIds,
    ];

    this.customerAnonymizedDocuments.length = 0;
    this.notSynchronizedOperationsIds.length = 0;

    const session: mongoose.ClientSession = await mongoose.startSession();
    await this.customersAnonymizedRepository.upsertDocumentsBatch(
      currentCustomersAnonymizedDocuments,
      session
    );
    await this.customersAuditRepository.setDocumentsSynchronizedByIds(
      currentNotSynchronizedOperationsIds
    );
    await session.endSession();

    log(
      "> SYNCHRONIZED DOCUMENTS IN CURRENT BATCH :",
      currentCustomersAnonymizedDocuments.length
    );
  }

  //----------------------------------------------------------------------------------------------------------------//
  public async executeFullSynchronization() {
    const allCustomers = await this.customersRepository.getAllDocuments();
    const lastOperation = await this.customersAuditRepository.getLastDocument();
    const anonymizedCustomers = allCustomers.map(anonymizeCustomerFields);

    await this.customersAnonymizedRepository.upsertDocumentsBatch(
      anonymizedCustomers
    );

    if (lastOperation) {
      const lastOperationId = new mongoose.Types.ObjectId(lastOperation._id);
      await this.customersAuditRepository.setAllBelowIdSynchronized(
        lastOperationId
      );
    }

    log("> FULL SYNCHRONIZATION COMPLETE");
    process.exit(0);
  }

  //----------------------------------------------------------------------------------------------------------------//
  private async handleOperation(operation: IMongodbOperationInfo) {
    if (this.customerAnonymizedDocuments.length >= 1000) {
      await this.executeSynchronization();
    }

    const { operationType, fullDocument, updateDescription, documentKey } =
      operation;
    const currentOperationId = get(operation, "_id._data");

    if (operationType === "insert") {
      const anonymizedCustomerDocument = anonymizeCustomerFields(fullDocument);
      this.customerAnonymizedDocuments.push(anonymizedCustomerDocument);
      this.notSynchronizedOperationsIds.push(currentOperationId);
    }

    if (operationType === "update") {
      const anonymizedCustomerFields = anonymizeCustomerFields({
        ...documentKey,
        ...updateDescription.updatedFields,
      });
      this.customerAnonymizedDocuments.push(anonymizedCustomerFields);
      this.notSynchronizedOperationsIds.push(currentOperationId);
    }
  }
}
