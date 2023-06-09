import mongoose from "mongoose";
import { ICustomerFields } from "../interfaces/customer-fields.interface";

export class CustomersRepository {
  constructor(private readonly customerCollection: mongoose.Collection) {}

  //----------------------------------------------------------------------------------------------------------------//
  addChangesListener(listener) {
    return this.customerCollection.watch().on("change", listener);
  }

  //----------------------------------------------------------------------------------------------------------------//
  async getAllDocuments(limit?: number) {
    return this.customerCollection
      .find({}, { limit: limit })
      .toArray() as Promise<ICustomerFields[]>;
  }

  //----------------------------------------------------------------------------------------------------------------//
  async insertBatch(batch: ICustomerFields[]) {
    return this.customerCollection.insertMany(batch);
  }
}
