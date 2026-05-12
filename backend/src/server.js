import "dotenv/config";
import app from "./app.js";
import { connectDb } from "./config/db.js";

const port = process.env.PORT || 5000;

async function bootstrap() {
  await connectDb();
  app.listen(port, () => {
    console.log(`SellChey API listening on port ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
