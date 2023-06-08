import mongoose from "mongoose";
import { ICustomerFields } from "../interfaces/customer-fields.interface";

const { faker } = require("@faker-js/faker");

export function generateCustomer(): ICustomerFields {
  return {
    _id: new mongoose.Types.ObjectId(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    address: {
      line1: faker.location.streetAddress(),
      line2: faker.location.streetAddress(),
      postcode: faker.location.zipCode(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
    },
    createdAt: new Date(),
  };
}
