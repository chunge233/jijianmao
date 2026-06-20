import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import Fastify from 'fastify'
import { registerRoutes } from './routes.js'
import { flushStore, loadStore, saveStore } from './store.js'

export async function buildApp() {
  await loadStore()

  const app = Fastify({
    logger: true
  })

  await app.register(cors, {
    origin: true
  })

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me'
  })

  app.addHook('onResponse', async (request, reply) => {
    const isMessageReadRequest = request.method === 'GET' && /^\/api\/messages\/[^/?]+/.test(request.url)

    if ((request.method !== 'GET' || isMessageReadRequest) && reply.statusCode < 500) {
      await saveStore()
    }
  })

  app.addHook('onClose', async () => {
    await flushStore()
  })

  await registerRoutes(app)

  return app
}
