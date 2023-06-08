import { Types } from "mongoose";
import { ICustomerFields } from "./customer-fields.interface";

export default interface IMongodbOperationInfo {
  _id: { _data: string };
  operationType: string;
  fullDocument: ICustomerFields;
  updateDescription: {
    updatedFields: ICustomerFields;
  };
  documentKey: {
    _id: Types.ObjectId;
  };
}
