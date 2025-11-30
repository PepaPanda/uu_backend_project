import "dotenv/config";
import app from "./server.js";
import { mongo } from "./repository/connect.js";

const { PORT } = process.env;

try {
  const client = await mongo;
  await client.connect();
} catch (err) {
  console.error(err);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Backend is running on http://localhost:${PORT}`);
});
