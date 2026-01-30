import "dotenv/config";
import app from "./server.js";
import { mongo, initDB } from "./repository/connect.js";

const { PORT } = process.env;

try {
  const client = await mongo;
  await client.connect();
  await initDB();
} catch (err) {
  console.error(err);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Backend is a running on http://localhost:${PORT}`);
});

