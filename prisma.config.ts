import 'dotenv/config'
import { defineConfig } from 'prisma/config'

function getDatasourceUrl() {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error('DATABASE_URL is required')
  }

  return url
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: getDatasourceUrl(),
  },
})
