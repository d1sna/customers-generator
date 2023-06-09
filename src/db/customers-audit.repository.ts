import mongoose from "mongoose";

export class CustomersAuditRepository {
  constructor(private readonly customersAuditCollection: mongoose.Collection) {
    this.customersAuditCollection.createIndex({ "operation._id.data": -1 });
  }

  //----------------------------------------------------------------------------------------------------------------//
  async setAllBelowIdSynchronized(id: mongoose.Types.ObjectId) {
    return this.customersAuditCollection.updateMany(
      { _id: { $lte: id } },
      { $set: { synchronized: true } }
    );
  }

  //----------------------------------------------------------------------------------------------------------------//
  async getLastDocument() {
    return this.customersAuditCollection.findOne({}, { sort: { _id: -1 } });
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
