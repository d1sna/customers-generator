import { Types } from "mongoose";
import { ICustomerAddress } from "./customer-address.interface";

export interface ICustomerFields {
  _id?: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  email?: string;
  address?: ICustomerAddress;
  createdAt?: Date;
}
