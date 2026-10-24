/** `drizzle-kit` config for the local repos DB. `npm run db:generate` turns the schema into `create-tables.generated.ts`. */
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/main/local-repos/db/schema.ts'
})
