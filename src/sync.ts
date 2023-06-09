import connectToMongoDb from "./lib/connect-to-mongodb";
import { FULL_SYNC_LAUNCH_ARGUMENT } from "./lib/constants";
import { getMongodbUriFromEnv } from "./lib/get-mongodb-uri-from-env";

import { SynchronizationService } from "./services/synchronization.service";

const startSynchronizationApp = async () => {
  const mongoUri = getMongodbUriFromEnv();
  await connectToMongoDb(mongoUri);
  const synchronizationService =
    SynchronizationService.createFromMongooseCollections();

  const currentLaunchArguments = process.argv.slice(2);
  if (currentLaunchArguments.includes(FULL_SYNC_LAUNCH_ARGUMENT))
    await synchronizationService.executeFullSynchronization();

  await synchronizationService.handleMissedOperations();
  synchronizationService.addListenerToCustomersChanges();
  synchronizationService.executeSynchronizationEverySecond();
};

startSynchronizationApp();
