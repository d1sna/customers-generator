import { Types } from "mongoose";

export default interface IMongodbOperationInfo {
  _id: { _data: string };
  operationType: string;
  fullDocument: object;
  updateDescription: {
    updatedFields: object;
  };
  documentKey: {
    _id: Types.ObjectId;
  };
}
