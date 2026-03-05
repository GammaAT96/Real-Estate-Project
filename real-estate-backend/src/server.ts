import app from "./app.js";
import prisma from "./config/prisma.js";
import { logger } from "./config/logger.js";

const PORT = parseInt(process.env.PORT ?? "5000", 10);

async function startServer() {
  try {
    await prisma.$connect();
    logger.info("Connected to database");

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  }
}

startServer();