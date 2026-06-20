import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = process.cwd()
const routesPath = join(root, 'server/src/routes.ts')
const smokePath = join(root, 'server/scripts/smoke.mjs')

const routeSource = await readFile(routesPath, 'utf8')
const smokeSource = await readFile(smokePath, 'utf8')

const routePattern = /app\.(get|post|patch|delete|put)\(\s*['`]([^'`]+)['`]/g
const requestPattern = /\b\w+\.request\(\s*([`'"])([\s\S]*?)\1/g

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stripQuery(path) {
  return path.replace(/\?.*$/, '')
}

function normalizeSmokePath(path) {
  return stripQuery(path).replace(/\$\{[^}]+\}/g, '__dynamic__')
}

function routeRegex(path) {
  const expression = path
    .split('/')
    .map((segment) => {
      if (!segment) return ''
      return segment.startsWith(':') ? '[^/]+' : escapeRegExp(segment)
    })
    .join('/')

  return new RegExp(`^${expression}$`)
}

const routes = []
let match

while ((match = routePattern.exec(routeSource))) {
  routes.push({
    method: match[1].toUpperCase(),
    path: match[2],
    covered: false,
    matcher: routeRegex(match[2])
  })
}

function findCallEnd(source, startIndex) {
  let depth = 0
  let quote = ''
  let escaped = false

  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index]

    if (quote) {
      if (escaped) {
        escaped = false
        continue
      }
      if (char === '\\') {
        escaped = true
        continue
      }
      if (char === quote) {
        quote = ''
      }
      continue
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char
      continue
    }

    if (char === '(') {
      depth += 1
      continue
    }

    if (char === ')') {
      depth -= 1
      if (depth === 0) {
        return index
      }
    }
  }

  return source.length
}

while ((match = requestPattern.exec(smokeSource))) {
  const path = normalizeSmokePath(match[2])
  const callStart = smokeSource.indexOf('(', match.index)
  const callEnd = findCallEnd(smokeSource, callStart)
  const callSource = smokeSource.slice(callStart, callEnd + 1)
  const methodMatch = callSource.match(/method\s*:\s*['"]([A-Z]+)['"]/)
  const method = methodMatch ? methodMatch[1] : 'GET'
  const route = routes.find((item) => item.method === method && item.matcher.test(path))

  if (route) {
    route.covered = true
  }
}

const missing = routes.filter((route) => !route.covered)

if (missing.length) {
  console.error('Missing smoke coverage for server routes:')
  missing.forEach((route) => {
    console.error(`- ${route.method} ${route.path}`)
  })
  process.exit(1)
}

console.log(`server smoke route coverage ok (${routes.length}/${routes.length})`)
