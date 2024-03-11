import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import logger from "jet-logger";

export async function initializeMongoServer() {
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  mongoose.connect(mongoUri);

  mongoose.connection.on("error", (e) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (e.message.code === "ETIMEDOUT") {
      logger.err(e);
      mongoose.connect(mongoUri);
    }
    logger.err(e);
  });

  mongoose.connection.once("open", () => {
    logger.info(`MongoDB successfully connected to ${mongoUri}`);
  });
}
