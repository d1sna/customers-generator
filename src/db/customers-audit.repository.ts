import mongoose from "mongoose";

export class CustomersAuditRepository {
  constructor(private readonly customersAuditCollection: mongoose.Collection) {
    this.customersAuditCollection.createIndex({ "operation._id.data": -1 });
  }

  //----------------------------------------------------------------------------------------------------------------//
  async setAllDocumentsSynchronized() {
    return this.customersAuditCollection.updateMany(
      {},
      { $set: { synchronized: true } }
    );
  }

  //----------------------------------------------------------------------------------------------------------------//
  async setDocumentsSynchronizedByIds(
    ids: string[],
    session?: mongoose.ClientSession
  ) {
    return this.customersAuditCollection.updateMany(
      {
        "operation._id._data": { $in: ids },
      },
      { $set: { synchronized: true } },
      { session }
    );
  }

  //----------------------------------------------------------------------------------------------------------------//
  async createNewDocument(operation) {
    return this.customersAuditCollection.insertOne({
      operation,
      synchronized: false,
    });
  }

  //----------------------------------------------------------------------------------------------------------------//
  async findNotSynchronizedDocuments() {
    return this.customersAuditCollection
      .find({ synchronized: false })
      .toArray();
  }
}
