import mongoose from "mongoose";
import { CustomersRepository } from "../db/customers.repository";
import {
  CUSTOMERS_AUDIT_COLLECTION_NAME,
  CUSTOMERS_COLLECTION_NAME,
} from "../lib/constants";
import { CustomersAuditRepository } from "../db/customers-audit.repository";
import IMongodbOperationInfo from "../interfaces/mongodb-operation-info.interface";
import { getRandomNumberFromInterval } from "../lib/get-random-number-from-interval";
import { ICustomerFields } from "../interfaces/customer-fields.interface";
import { log } from "console";
const { faker } = require("@faker-js/faker");

export class CustomerGeneratorService {
  constructor(
    private readonly customersRepository: CustomersRepository,
    private readonly customersAuditRepository: CustomersAuditRepository
  ) {}

  //----------------------------------------------------------------------------------------------------------------//
  public static createFromMongooseCollections() {
    const customersCollection = mongoose.connection.collection(
      CUSTOMERS_COLLECTION_NAME
    );
    const customersAuditCollection = mongoose.connection.collection(
      CUSTOMERS_AUDIT_COLLECTION_NAME
    );

    return new CustomerGeneratorService(
      new CustomersRepository(customersCollection),
      new CustomersAuditRepository(customersAuditCollection)
    );
  }

  //----------------------------------------------------------------------------------------------------------------//
  public startAuditForCustomersCollection() {
    this.customersRepository.addChangesListener(
      async (operation: IMongodbOperationInfo) => {
        if (["insert", "update"].includes(operation.operationType)) {
          await this.customersAuditRepository.createNewDocument(operation);
        }
      }
    );
  }

  //----------------------------------------------------------------------------------------------------------------//
  public createCustomersEveryTwoHundredMs() {
    setInterval(async () => {
      const randomNumberFromOneToTen: number = getRandomNumberFromInterval(
        1,
        10
      );
      const generatedCustomers: Array<ICustomerFields> = [];

      for (let i = 0; i <= randomNumberFromOneToTen; i++) {
        const generatedCustomer = this.generateCustomer();
        generatedCustomers.push(generatedCustomer);
      }

      const operationResult = await this.customersRepository.insertBatch(
        generatedCustomers
      );
      log(
        "> CREATED CUSTOMERS IN CURRENT BATCH :",
        operationResult.insertedCount
      );
    }, 200);
  }

  //----------------------------------------------------------------------------------------------------------------//
  private generateCustomer(): ICustomerFields {
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
}
