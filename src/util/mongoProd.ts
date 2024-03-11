import mongoose from "mongoose";
import logger from "jet-logger";

export async function connectToProdDatabase(connectionString: string) {
  try {
    await mongoose.connect(connectionString);
    logger.info("successfully connected to database");
  } catch (err) {
    logger.err("couldn't connect to database");
    logger.err(err);
  }
}
