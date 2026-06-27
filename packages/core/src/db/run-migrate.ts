import { runMigrations } from "./migrate.js";

runMigrations().catch((error) => {
  console.error(error);
  process.exit(1);
});
