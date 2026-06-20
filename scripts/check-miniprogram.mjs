import { readdir, readFile, stat } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const miniprogramRoot = join(root, 'miniprogram')
const appJsonPath = join(miniprogramRoot, 'app.json')

async function collectFiles(dir, extension, files = []) {
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      await collectFiles(fullPath, extension, files)
      continue
    }

    if (entry.isFile() && entry.name.endsWith(extension)) {
      files.push(fullPath)
    }
  }

  return files
}

async function exists(file) {
  try {
    await stat(file)
    return true
  } catch (error) {
    return false
  }
}

function normalizePagePath(pagePath) {
  return pagePath
    .split('?')[0]
    .replace(/^\/+/, '')
    .replace(/^miniprogram\//, '')
}

function extractMethodNames(source) {
  const patterns = [
    /^\s*([A-Za-z_$][\w$]*)\s*\([^\n)]*\)\s*\{/gm,
    /\b([A-Za-z_$][\w$]*)\s*:\s*function\s*\(/g,
    /\b([A-Za-z_$][\w$]*)\s*:\s*\([^\n)]*\)\s*=>/g
  ]
  const methods = new Set()

  for (const pattern of patterns) {
    pattern.lastIndex = 0
    let match = pattern.exec(source)

    while (match) {
      methods.add(match[1])
      match = pattern.exec(source)
    }
  }

  return methods
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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

function readQuotedValue(source, startIndex) {
  const quote = source[startIndex]
  let value = ''
  let escaped = false
  let templateDepth = 0

  for (let index = startIndex + 1; index < source.length; index += 1) {
    const char = source[index]

    if (escaped) {
      value += char
      escaped = false
      continue
    }

    if (char === '\\') {
      value += char
      escaped = true
      continue
    }

    if (quote === '`') {
      if (char === '`' && templateDepth === 0) {
        return value
      }

      if (char === '$' && source[index + 1] === '{') {
        value += '${'
        templateDepth += 1
        index += 1
        continue
      }

      if (char === '{' && templateDepth > 0) {
        value += char
        templateDepth += 1
        continue
      }

      if (char === '}' && templateDepth > 0) {
        value += char
        templateDepth -= 1
        continue
      }

      value += char
      continue
    }

    if (char === quote) {
      return value
    }

    value += char
  }

  return value
}

function templateUrlToPath(value) {
  let output = ''

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]

    if (char === '$' && value[index + 1] === '{') {
      let depth = 1
      let expression = ''
      index += 2

      for (; index < value.length; index += 1) {
        const expressionChar = value[index]

        if (expressionChar === '{') {
          depth += 1
          expression += expressionChar
          continue
        }

        if (expressionChar === '}') {
          depth -= 1
          if (depth === 0) {
            break
          }
          expression += expressionChar
          continue
        }

        expression += expressionChar
      }

      if (!/[`'"]\?/.test(expression)) {
        output += '__dynamic__'
      }
      continue
    }

    output += char
  }

  return output.replace(/\?.*$/, '')
}

function assertNoMergeMarkers(file, content) {
  if (/^(<<<<<<<|=======|>>>>>>>) /m.test(content)) {
    console.error(`Unresolved merge marker in ${relative(root, file)}`)
    process.exit(1)
  }
}

function assertBalancedWxss(file, content) {
  const stack = []
  const pairs = {
    '}': '{',
    ')': '(',
    ']': '['
  }
  let quote = ''
  let escaped = false
  let inComment = false

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index]
    const next = content[index + 1]

    if (inComment) {
      if (char === '*' && next === '/') {
        inComment = false
        index += 1
      }
      continue
    }

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

    if (char === '/' && next === '*') {
      inComment = true
      index += 1
      continue
    }

    if (char === '"' || char === "'") {
      quote = char
      continue
    }

    if (char === '{' || char === '(' || char === '[') {
      stack.push(char)
      continue
    }

    if (pairs[char]) {
      const expected = pairs[char]
      const actual = stack.pop()
      if (actual !== expected) {
        console.error(`Unbalanced WXSS delimiter in ${relative(root, file)} near "${char}"`)
        process.exit(1)
      }
    }
  }

  if (inComment) {
    console.error(`Unclosed WXSS comment in ${relative(root, file)}`)
    process.exit(1)
  }

  if (quote) {
    console.error(`Unclosed WXSS string in ${relative(root, file)}`)
    process.exit(1)
  }

  if (stack.length) {
    console.error(`Unbalanced WXSS delimiter in ${relative(root, file)} near "${stack[stack.length - 1]}"`)
    process.exit(1)
  }
}

const jsFiles = await collectFiles(miniprogramRoot, '.js')
const jsonFiles = await collectFiles(miniprogramRoot, '.json')
const wxmlFiles = await collectFiles(miniprogramRoot, '.wxml')
const wxssFiles = await collectFiles(miniprogramRoot, '.wxss')

for (const file of jsFiles) {
  const content = await readFile(file, 'utf8')
  assertNoMergeMarkers(file, content)
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' })

  if (result.status !== 0) {
    process.exit(result.status || 1)
  }
}

for (const file of jsonFiles) {
  const content = await readFile(file, 'utf8')
  assertNoMergeMarkers(file, content)
  JSON.parse(content)
}

for (const file of wxmlFiles) {
  assertNoMergeMarkers(file, await readFile(file, 'utf8'))
}

for (const file of wxssFiles) {
  const content = await readFile(file, 'utf8')
  assertNoMergeMarkers(file, content)
  assertBalancedWxss(file, content)
}

const appJson = JSON.parse(await readFile(appJsonPath, 'utf8'))
const registeredPages = new Set(appJson.pages || [])
const missingPageFiles = []
const missingComponents = []

for (const page of registeredPages) {
  for (const extension of ['.js', '.json', '.wxml', '.wxss']) {
    const file = join(miniprogramRoot, `${page}${extension}`)

    if (!(await exists(file))) {
      missingPageFiles.push(`${page}${extension}`)
    }
  }
}

if (missingPageFiles.length) {
  console.error(`Missing registered page files:\n${missingPageFiles.join('\n')}`)
  process.exit(1)
}

const pageJsFiles = jsFiles.filter((file) => file.includes(`${join('miniprogram', 'pages')}`))
const unregisteredPageFiles = pageJsFiles
  .map((file) => relative(miniprogramRoot, file).replace(/\\/g, '/').replace(/\.js$/, ''))
  .filter((page) => !registeredPages.has(page))

if (unregisteredPageFiles.length) {
  console.error(`Unregistered page files:\n${unregisteredPageFiles.join('\n')}`)
  process.exit(1)
}

for (const file of jsonFiles) {
  const json = JSON.parse(await readFile(file, 'utf8'))
  const usingComponents = json.usingComponents || {}

  for (const [name, componentPath] of Object.entries(usingComponents)) {
    if (typeof componentPath !== 'string') {
      missingComponents.push(`${relative(root, file)} -> ${name}: invalid component path`)
      continue
    }

    const componentBase = componentPath.startsWith('/')
      ? join(miniprogramRoot, componentPath.replace(/^\/+/, ''))
      : join(dirname(file), componentPath)
    const componentLabel = relative(miniprogramRoot, componentBase).replace(/\\/g, '/')

    for (const extension of ['.js', '.wxml', '.json']) {
      if (!(await exists(`${componentBase}${extension}`))) {
        missingComponents.push(`${relative(root, file)} -> ${name}: ${componentLabel}${extension}`)
      }
    }
  }
}

if (missingComponents.length) {
  console.error(`Invalid component references:\n${missingComponents.join('\n')}`)
  process.exit(1)
}

const allSourceFiles = [...jsFiles, ...wxmlFiles]
const assetSourceFiles = [...jsFiles, ...wxmlFiles, ...wxssFiles]
const navigationPattern = /(?:url|path|pagePath)\s*:\s*[`'"]([^`'"]*pages\/[^`'"]+)/g
const badReferences = []
const missingAssets = []
const missingWxKeys = []
let checkedNavigationReferences = 0
let checkedAssetReferences = 0
let checkedWxForBlocks = 0

for (const file of allSourceFiles) {
  const content = await readFile(file, 'utf8')
  navigationPattern.lastIndex = 0
  let match = navigationPattern.exec(content)

  while (match) {
    const reference = match[1]
    const pagePath = normalizePagePath(reference)

    if (!pagePath.includes('${')) {
      checkedNavigationReferences += 1
      if (!registeredPages.has(pagePath)) {
        badReferences.push(`${relative(root, file)} -> ${reference}`)
      }
    }

    match = navigationPattern.exec(content)
  }
}

for (const file of wxmlFiles) {
  const content = await readFile(file, 'utf8')

  for (const match of content.matchAll(/<[^>]+\bwx:for\s*=\s*["'][^"']+["'][^>]*>/g)) {
    checkedWxForBlocks += 1
    if (!/\bwx:key\s*=/.test(match[0])) {
      missingWxKeys.push(`${relative(root, file)} -> ${match[0].slice(0, 120)}`)
    }
  }
}

if (missingWxKeys.length) {
  console.error(`Missing wx:key on wx:for blocks:\n${missingWxKeys.join('\n')}`)
  process.exit(1)
}

for (const file of assetSourceFiles) {
  const content = await readFile(file, 'utf8')
  const checkedAssetsInFile = new Set()

  for (const assetMatch of content.matchAll(/['"]((?:\/|\.{1,2}\/)*assets\/[^'"{}]+)['"]/g)) {
    const rawAsset = assetMatch[1]
    checkedAssetsInFile.add(rawAsset)
  }

  for (const assetMatch of content.matchAll(/url\(\s*['"]?((?:\/|\.{1,2}\/)*assets\/[^'")]+)['"]?\s*\)/g)) {
    checkedAssetsInFile.add(assetMatch[1])
  }

  for (const rawAsset of checkedAssetsInFile) {
    checkedAssetReferences += 1
    const assetPath = rawAsset.startsWith('/')
      ? join(miniprogramRoot, rawAsset.replace(/^\/+/, ''))
      : join(dirname(file), rawAsset)

    if (!(await exists(assetPath))) {
      missingAssets.push(`${relative(root, file)} -> ${rawAsset}`)
    }
  }
}

if (badReferences.length) {
  console.error(`Invalid static page references:\n${badReferences.join('\n')}`)
  process.exit(1)
}

const tabBarPages = (appJson.tabBar && appJson.tabBar.list) || []
const invalidTabBarPages = tabBarPages
  .map((item) => item && item.pagePath)
  .filter((pagePath) => pagePath && !registeredPages.has(normalizePagePath(pagePath)))

if (invalidTabBarPages.length) {
  console.error(`Invalid tabBar page references:\n${invalidTabBarPages.join('\n')}`)
  process.exit(1)
}

if (missingAssets.length) {
  console.error(`Missing static assets:\n${missingAssets.join('\n')}`)
  process.exit(1)
}

const penPagePath = join(miniprogramRoot, 'utils/pen-page.js')
const sharedPenPageMethods = extractMethodNames(await readFile(penPagePath, 'utf8'))
const bindingPattern = /\b(?:bind|catch)(?::[\w-]+|[\w-]+)\s*=\s*"([A-Za-z_$][\w$]*)"/g
const missingHandlers = []
let checkedEventHandlers = 0

for (const file of wxmlFiles) {
  const jsPath = file.replace(/\.wxml$/, '.js')
  const jsSource = await readFile(jsPath, 'utf8').catch(() => '')
  const methods = extractMethodNames(jsSource)

  if (jsSource.includes('createPenPage')) {
    sharedPenPageMethods.forEach((method) => methods.add(method))
  }

  const content = await readFile(file, 'utf8')
  bindingPattern.lastIndex = 0
  let match = bindingPattern.exec(content)

  while (match) {
    const handler = match[1]
    checkedEventHandlers += 1

    if (!methods.has(handler)) {
      missingHandlers.push(`${relative(root, file)} -> ${handler}`)
    }

    match = bindingPattern.exec(content)
  }
}

if (missingHandlers.length) {
  console.error(`Missing WXML event handlers:\n${missingHandlers.join('\n')}`)
  process.exit(1)
}

const apiPath = join(miniprogramRoot, 'utils/api.js')
const apiSource = await readFile(apiPath, 'utf8')
const apiMethods = new Set(
  Array.from(apiSource.matchAll(/^\s*([A-Za-z0-9_]+)\s*\([^\n)]*\)\s*\{/gm)).map((match) => match[1])
)
const apiUsagePattern = /\bapi\.([A-Za-z0-9_]+)\s*\(/g
const missingApiMethods = []

for (const file of jsFiles) {
  if (file === apiPath) {
    continue
  }

  const content = await readFile(file, 'utf8')
  apiUsagePattern.lastIndex = 0
  let match = apiUsagePattern.exec(content)

  while (match) {
    if (!apiMethods.has(match[1])) {
      missingApiMethods.push(`${relative(root, file)} -> api.${match[1]}()`)
    }

    match = apiUsagePattern.exec(content)
  }
}

if (missingApiMethods.length) {
  console.error(`Missing API methods:\n${missingApiMethods.join('\n')}`)
  process.exit(1)
}

const routesPath = join(root, 'server/src/routes.ts')
const routeSource = await readFile(routesPath, 'utf8')
const routePattern = /app\.(get|post|patch|delete|put)\(\s*['`]([^'`]+)['`]/g
const serverRoutes = []
let routeMatch = routePattern.exec(routeSource)

while (routeMatch) {
  serverRoutes.push({
    method: routeMatch[1].toUpperCase(),
    path: routeMatch[2],
    matcher: routeRegex(routeMatch[2])
  })
  routeMatch = routePattern.exec(routeSource)
}

const missingApiEndpoints = []
let requestIndex = apiSource.indexOf('request(')
let checkedApiEndpoints = 0

while (requestIndex !== -1) {
  const callEnd = findCallEnd(apiSource, requestIndex + 'request'.length)
  const callSource = apiSource.slice(requestIndex, callEnd + 1)
  const urlIndex = callSource.indexOf('url')
  const colonIndex = urlIndex === -1 ? -1 : callSource.indexOf(':', urlIndex)
  const quoteOffset = colonIndex === -1 ? -1 : callSource.slice(colonIndex + 1).search(/[`'"]/)

  if (quoteOffset === -1) {
    missingApiEndpoints.push(`${relative(root, apiPath)} -> request() missing static url`)
  } else {
    checkedApiEndpoints += 1
    const quoteIndex = colonIndex + 1 + quoteOffset
    const url = readQuotedValue(callSource, quoteIndex)
    const methodMatch = callSource.match(/method\s*:\s*['"]([A-Z]+)['"]/)
    const method = methodMatch ? methodMatch[1] : 'GET'
    const path = templateUrlToPath(url)
    const matchedRoute = serverRoutes.some((route) => route.method === method && route.matcher.test(path))

    if (!matchedRoute) {
      missingApiEndpoints.push(`${method} ${url} -> ${path}`)
    }
  }

  requestIndex = apiSource.indexOf('request(', callEnd + 1)
}

if (missingApiEndpoints.length) {
  console.error(`Frontend API endpoints missing server routes:\n${missingApiEndpoints.join('\n')}`)
  process.exit(1)
}

console.log(`miniprogram syntax ok (${jsFiles.length} js, ${jsonFiles.length} json, ${wxmlFiles.length} wxml)`)
console.log(`miniprogram pages ok (${registeredPages.size} registered pages)`)
console.log(`miniprogram styles ok (${wxssFiles.length} wxss)`)
console.log(`miniprogram references ok (${checkedNavigationReferences} navigation, ${checkedAssetReferences} assets, ${checkedEventHandlers} handlers, ${checkedWxForBlocks} wx:for)`)
console.log(`miniprogram api contract ok (${apiMethods.size} methods, ${checkedApiEndpoints} endpoints)`)
