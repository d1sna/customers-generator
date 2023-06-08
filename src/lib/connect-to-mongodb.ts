import mongoose from "mongoose";
import { log } from "console";

export default async function connectToMongoDb(mongodbUri: string) {
  try {
    log("> CONNECTING TO MONGO DB...");
    await mongoose.connect(mongodbUri);
    log("> CONNECTED TO MONGO DB SUCCESSFUL");
  } catch (error) {
    log("> CONNECTION TO MONGO DB FAILED :", error);
    process.exit(0);
  }
}
