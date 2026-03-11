import { defineConfig } from "prisma/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

export default defineConfig({
  datasource: {
    adapter: () => {
      const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
      });
      return new PrismaPg(pool);
    },
  },
  migrate: {
    adapter: () => {
      const pool = new pg.Pool({
        connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
      });
      return new PrismaPg(pool);
    },
  },
});
