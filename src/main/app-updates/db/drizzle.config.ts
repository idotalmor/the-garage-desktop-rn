/** `drizzle-kit` config for the app updates DB. `npm run db:generate` turns the schema into `create-tables.generated.ts`. */
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/main/app-updates/db/schema.ts'
})
