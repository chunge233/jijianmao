import type { FastifyRequest } from 'fastify'
import type { AuthClaims } from './types.js'

export async function requireAuth(request: FastifyRequest): Promise<AuthClaims> {
  return request.jwtVerify<AuthClaims>()
}

export function bodyOf<T extends Record<string, unknown>>(request: FastifyRequest): Partial<T> {
  return (request.body || {}) as Partial<T>
}

export function queryOf<T extends Record<string, unknown>>(request: FastifyRequest): Partial<T> {
  return (request.query || {}) as Partial<T>
}

export function paramsOf<T extends Record<string, string>>(request: FastifyRequest): Partial<T> {
  return (request.params || {}) as Partial<T>
}

export function toMoney(cents: number) {
  return Number((cents / 100).toFixed(2))
}
