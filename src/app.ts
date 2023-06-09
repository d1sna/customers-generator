import connectToMongoDb from "./lib/connect-to-mongodb";
import { getMongodbUriFromEnv } from "./lib/get-mongodb-uri-from-env";
import { CustomerGeneratorService } from "./services/customer-generator.service";

async function startCustomersGeneratorApp() {
  const mongoUri = getMongodbUriFromEnv();
  await connectToMongoDb(mongoUri);
  const customerGeneratorService =
    CustomerGeneratorService.createFromMongooseCollections();

  customerGeneratorService.startAuditForCustomersCollection();
  customerGeneratorService.createCustomersEveryTwoHundredMs();
}

startCustomersGeneratorApp();
