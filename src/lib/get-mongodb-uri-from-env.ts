const dotenv = require("dotenv");
import { log } from "console";

export function getMongodbUriFromEnv(): string {
  dotenv.config({ path: ".env" });
  const mongodbUri = process.env["DB_URI"];

  if (!mongodbUri) {
    log("> PLS CHECK README AND SET ENV");
    process.exit(1);
  }

  return mongodbUri;
}
