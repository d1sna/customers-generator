import mongoose from "mongoose";
import { ICustomerFields } from "../interfaces/customer-fields.interface";

export class CustomersAnonymizedRepository {
  constructor(
    private readonly customersAnonymizedCollection: mongoose.Collection
  ) {}

  //----------------------------------------------------------------------------------------------------------------//
  async upsertDocumentsBatch(
    customersAnonymizedFieldsBatch: ICustomerFields[],
    session?: mongoose.ClientSession
  ) {
    const bulkCommands = customersAnonymizedFieldsBatch.map(
      (anonymizedCustomerFields) => ({
        updateOne: {
          filter: { _id: anonymizedCustomerFields._id },
          update: { $set: anonymizedCustomerFields },
          upsert: true,
        },
      })
    );

    return this.customersAnonymizedCollection.bulkWrite(bulkCommands, {
      session,
    });
  }
}
