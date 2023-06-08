import connectToMongoDb from "./lib/connect-to-mongodb";
import { getMongodbUriFromEnv } from "./lib/get-mongodb-uri-from-env";

async function start() {
  const mongoUri = getMongodbUriFromEnv();
  await connectToMongoDb(mongoUri);
}

start();
