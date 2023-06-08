import { ICustomerFields } from "../interfaces/customer-fields.interface";
import encryptStringToEightSymbols from "./encrypt-string-to-eight-symbols";

export default function anonymizeCustomerFields(
  customerFields: ICustomerFields
) {
  const { _id, firstName, lastName, email, address, createdAt } =
    customerFields;
  const anonymizedCustomerFields: ICustomerFields = { _id };

  if (firstName) {
    anonymizedCustomerFields.firstName = encryptStringToEightSymbols(firstName);
  }

  if (lastName) {
    anonymizedCustomerFields.lastName = encryptStringToEightSymbols(lastName);
  }

  if (email) {
    anonymizedCustomerFields.email = `${encryptStringToEightSymbols(
      email.split("@")[0]
    )}@${email.split("@")[1]}`;
  }

  if (address) {
    anonymizedCustomerFields.address = {
      ...address,
      line1: encryptStringToEightSymbols(address.line1),
      line2: encryptStringToEightSymbols(address.line2),
      postcode: encryptStringToEightSymbols(address.postcode),
    };
  }

  if (createdAt) {
    anonymizedCustomerFields.createdAt = createdAt;
  }

  return anonymizedCustomerFields;
}
