import '@fastify/jwt'
import type { AuthClaims } from './types.js'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthClaims
    user: AuthClaims
  }
}
