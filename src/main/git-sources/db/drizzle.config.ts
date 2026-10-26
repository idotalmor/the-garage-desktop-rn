/** Schema generator configuration for git-sources.db. */
import { defineConfig } from 'drizzle-kit'
export default defineConfig({ dialect: 'sqlite', schema: './src/main/git-sources/db/schema.ts' })
