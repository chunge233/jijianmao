import { readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'

const root = process.cwd()
const miniprogramRoot = join(root, 'miniprogram')
const require = createRequire(import.meta.url)
const storage = new Map([
  ['auth_token', 'mock-token'],
  ['current_user', { id: 'user_1', nickname: 'Tester', phone: '13800000000' }],
  ['current_factory', { id: 'factory_demo', name: 'Demo Factory', inviteCode: 'JJM-1001' }]
])

const pages = []
const components = []
const failures = []
const asyncFailures = []
let checkedHandlers = 0

process.on('unhandledRejection', (error) => {
  asyncFailures.push(error)
})

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

function clone(value) {
  if (value === undefined || value === null) {
    return value
  }

  try {
    return JSON.parse(JSON.stringify(value))
  } catch (error) {
    return value
  }
}

function waitMicrotasks() {
  return new Promise((resolveWait) => setTimeout(resolveWait, 0))
}

function setByPath(target, path, value) {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)
  let cursor = target

  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index]
    if (cursor[key] === undefined || cursor[key] === null) {
      cursor[key] = /^\d+$/.test(parts[index + 1]) ? [] : {}
    }
    cursor = cursor[key]
  }

  cursor[parts[parts.length - 1]] = value
}

function extractHandlers(wxml) {
  const handlers = new Set()
  const pattern = /\b(?:bind|catch)(?::[\w-]+|[\w-]+)\s*=\s*"([A-Za-z_$][\w$]*)"/g
  let match = pattern.exec(wxml)

  while (match) {
    handlers.add(match[1])
    match = pattern.exec(wxml)
  }

  return Array.from(handlers)
}

function createEvent(handler) {
  const dataset = {
    id: 'process_1',
    reportId: 'report_1',
    routeId: 'route_1',
    processId: 'process_1',
    adjustmentId: 'price_1',
    index: '0',
    status: 'all',
    label: 'All',
    type: 'process',
    title: 'Test',
    path: '/pages/home/index',
    cycle: 'yearly',
    role: 'employee',
    chip: 'All',
    name: 'Test'
  }

  return {
    type: handler,
    currentTarget: { dataset },
    target: { dataset },
    detail: {
      value: 'Test',
      checked: true,
      action: '',
      id: 'process_1',
      path: '/pages/home/index',
      title: 'Test'
    }
  }
}

function responseFor(url, method, data) {
  const parsed = new URL(url, 'http://127.0.0.1:3000')
  const path = parsed.pathname
  const now = new Date().toISOString()
  const processItem = {
    id: 'process_1',
    name: 'Quality Check',
    priceCents: 50,
    price: '0.50',
    qrCode: 'PJ-QC-001',
    status: 'active'
  }
  const routeItem = {
    id: 'route_1',
    name: 'Main Route',
    qrCode: 'RT-MAIN-001',
    processes: [processItem],
    status: 'active'
  }
  const reportItem = {
    id: 'report_1',
    type: 'process',
    status: 'pending',
    workerName: 'Tester',
    quantity: 1,
    totalCents: 50,
    total: '0.50',
    createdAt: now,
    items: [{ processId: 'process_1', processName: 'Quality Check', quantity: 1, priceCents: 50, subtotalCents: 50 }]
  }

  if (path === '/api/me') {
    return { user: storage.get('current_user'), factory: storage.get('current_factory'), role: 'boss', needsFactory: false }
  }
  if (path === '/api/dashboard/overview') {
    return { salaryCents: 50, reportCount: 1, totalQuantity: 1, recentReports: [reportItem] }
  }
  if (path === '/api/dashboard/boss') {
    return { totalCents: 50, reportCount: 1, totalQuantity: 1, employeeCount: 1, pendingCount: 1, processRanking: [] }
  }
  if (path === '/api/factories' || path === '/api/factories/current') {
    return path === '/api/factories' ? [storage.get('current_factory')] : storage.get('current_factory')
  }
  if (path === '/api/factories/current/summary') {
    return { factory: storage.get('current_factory'), stats: { employees: 1, processes: 1, products: 1, routes: 1 } }
  }
  if (path === '/api/processes') {
    return method === 'POST' ? { ...processItem, id: 'process_new' } : [processItem]
  }
  if (path.startsWith('/api/processes/')) {
    return method === 'DELETE' ? { ok: true } : processItem
  }
  if (path === '/api/products') {
    return method === 'POST' ? { id: 'product_new', name: 'Product', status: 'active' } : [{ id: 'product_1', name: 'Product', status: 'active' }]
  }
  if (path.startsWith('/api/products/')) {
    return method === 'DELETE' ? { ok: true } : { id: 'product_1', name: 'Product', status: 'active' }
  }
  if (path === '/api/routes') {
    return method === 'POST' ? routeItem : [routeItem]
  }
  if (path.startsWith('/api/routes/')) {
    return method === 'DELETE' ? { ok: true } : routeItem
  }
  if (path === '/api/reports') {
    return method === 'POST' ? reportItem : [reportItem]
  }
  if (path === '/api/report-drafts') {
    return method === 'POST' ? { id: 'draft_1', ...reportItem } : [{ id: 'draft_1', ...reportItem }]
  }
  if (path.startsWith('/api/report-drafts/')) {
    return reportItem
  }
  if (path.startsWith('/api/reports/')) {
    return path.endsWith('/withdraw') || path.endsWith('/resubmit') ? { ok: true, ...reportItem } : reportItem
  }
  if (path === '/api/audits/pending') {
    return [reportItem]
  }
  if (path.startsWith('/api/audits/')) {
    return { ok: true, report: reportItem }
  }
  if (path === '/api/qr/resolve') {
    return { type: 'process', processId: 'process_1', process: processItem }
  }
  if (path === '/api/salaries/months') {
    return [{ month: '2026-06', totalCents: 50, reportCount: 1, quantity: 1, status: 'pending' }]
  }
  if (path.startsWith('/api/salaries/')) {
    if (path.endsWith('/confirmations')) {
      return { employees: [{ id: 'emp_1', name: 'Tester', amountCents: 50, quantity: 1, status: '待确认' }] }
    }
    return { month: '2026-06', totalCents: 50, reports: [reportItem], status: 'pending', ok: true }
  }
  if (path === '/api/subscription/plans') {
    return [{ id: 'pro', name: 'Pro', monthlyCents: 9900, yearlyCents: 93000, employeeLimit: 100 }]
  }
  if (path === '/api/subscription/current') {
    return { planId: 'basic', planName: 'Basic', status: 'trial', employeeLimit: 20 }
  }
  if (path === '/api/payment/orders') {
    return { order: { id: 'pay_1', planId: data?.planId || 'pro' } }
  }
  if (path === '/api/bills') {
    return [{ id: 'bill_1', title: 'Bill', amountCents: 50, status: 'paid', invoiceStatus: 'available' }]
  }
  if (path === '/api/messages') {
    return [{ id: 'msg_1', title: 'Message', content: 'Message', type: 'system', read: false }]
  }
  if (path.startsWith('/api/messages/')) {
    return { id: 'msg_1', title: 'Message', content: 'Message', type: 'system', read: true, ok: true }
  }
  if (path === '/api/announcements') {
    return method === 'POST' ? { id: 'ann_1', title: 'Announcement' } : [{ id: 'ann_1', title: 'Announcement', content: 'Content' }]
  }
  if (path.startsWith('/api/announcements/')) {
    return { id: 'ann_1', title: 'Announcement', content: 'Content', ok: true }
  }
  if (path === '/api/employees') {
    return method === 'POST' ? { id: 'emp_1', name: 'Tester' } : [{ id: 'emp_1', name: 'Tester', phone: '13800000000', role: 'employee', status: 'active' }]
  }
  if (path.startsWith('/api/employees/')) {
    return { id: 'emp_1', name: 'Tester', phone: '13800000000', role: 'employee', status: 'active', ok: true }
  }
  if (path === '/api/roles') {
    return method === 'POST' ? { id: 'role_1', name: 'Role' } : [{ id: 'boss', name: 'Admin', permissions: [] }]
  }
  if (path.startsWith('/api/roles/')) {
    return { id: 'boss', name: 'Admin', permissions: [] }
  }
  if (path === '/api/backups' || path === '/api/exports' || path === '/api/price-adjustments' || path === '/api/teams' || path === '/api/join-applications' || path === '/api/audit-logs') {
    return method === 'GET' ? [] : { id: 'mock_1', ok: true }
  }
  if (path.includes('/confirm') || path.includes('/approve') || path.includes('/reject') || path.includes('/restore')) {
    return { ok: true }
  }
  if (path === '/api/employee-imports/preview') {
    return { id: 'import_1', rows: [] }
  }
  if (path.startsWith('/api/employee-imports/')) {
    return { id: 'import_1', rows: [], ok: true }
  }
  if (path === '/api/notification-preferences') {
    return { reportAudit: true, salary: true, subscription: true, system: true }
  }

  return { ok: true }
}

globalThis.wx = {
  getStorageSync(key) {
    return storage.get(key) || ''
  },
  setStorageSync(key, value) {
    storage.set(key, value)
  },
  removeStorageSync(key) {
    storage.delete(key)
  },
  navigateTo(options = {}) {
    options.success?.({})
  },
  redirectTo(options = {}) {
    options.success?.({})
  },
  switchTab(options = {}) {
    options.success?.({})
  },
  navigateBack(options = {}) {
    options.success?.({})
  },
  showToast() {},
  showLoading() {},
  hideLoading() {},
  showModal(options = {}) {
    options.success?.({ confirm: false, cancel: true })
  },
  setClipboardData(options = {}) {
    options.success?.({})
  },
  scanCode(options = {}) {
    options.fail?.({ errMsg: 'scanCode:fail cancel' })
  },
  hideTabBar(options = {}) {
    options.success?.({})
  },
  getDeviceInfo() {
    return { platform: 'devtools' }
  },
  getSystemInfoSync() {
    return { platform: 'devtools', statusBarHeight: 20 }
  },
  getWindowInfo() {
    return { statusBarHeight: 20 }
  },
  getMenuButtonBoundingClientRect() {
    return { top: 24, height: 32 }
  },
  request(options = {}) {
    const method = options.method || 'GET'
    options.success?.({
      statusCode: 200,
      data: responseFor(options.url || '', method, options.data)
    })
  }
}

globalThis.getCurrentPages = () => [{
  getTabBar() {
    return {
      setData() {}
    }
  }
}]

globalThis.Page = (definition) => {
  pages.push(definition)
}

globalThis.Component = (definition) => {
  components.push(definition)
}

function defaultProperties(definition) {
  const properties = {}

  for (const [key, config] of Object.entries(definition.properties || {})) {
    properties[key] = clone(config && Object.prototype.hasOwnProperty.call(config, 'value') ? config.value : undefined)
  }

  return properties
}

function createInstance(definition, kind) {
  const instance = {
    data: clone(definition.data || {}),
    properties: kind === 'component' ? defaultProperties(definition) : {},
    setData(next = {}) {
      for (const [key, value] of Object.entries(next)) {
        setByPath(this.data, key, value)
      }
    },
    triggerEvent() {},
    getTabBar() {
      return { setData() {} }
    },
    selectComponent() {
      return { setData() {} }
    }
  }

  const methods = kind === 'component' ? (definition.methods || {}) : definition
  for (const [key, value] of Object.entries(methods)) {
    if (typeof value === 'function') {
      instance[key] = value.bind(instance)
    }
  }

  return instance
}

async function safeCall(label, fn) {
  try {
    const result = fn()
    if (result && typeof result.then === 'function') {
      await result
    }
    await waitMicrotasks()
  } catch (error) {
    failures.push(`${label}: ${error && error.stack ? error.stack : error}`)
  }
}

async function smokeFile(wxmlFile) {
  const jsFile = wxmlFile.replace(/\.wxml$/, '.js')
  if (!existsSync(jsFile)) {
    return
  }

  const beforePages = pages.length
  const beforeComponents = components.length
  const resolvedJs = require.resolve(resolve(jsFile))
  delete require.cache[resolvedJs]

  try {
    require(resolvedJs)
  } catch (error) {
    failures.push(`${relative(root, jsFile)} load: ${error && error.stack ? error.stack : error}`)
    return
  }

  const definition = pages[beforePages] || components[beforeComponents]
  const kind = pages[beforePages] ? 'page' : 'component'
  if (!definition) {
    failures.push(`${relative(root, jsFile)}: no Page() or Component() registration`)
    return
  }

  const instance = createInstance(definition, kind)
  const wxml = await readFile(wxmlFile, 'utf8')
  const handlers = extractHandlers(wxml)
  const label = relative(root, jsFile)
  const options = {
    id: 'process_1',
    reportId: 'report_1',
    month: '2026-06',
    type: 'process',
    processId: 'process_1',
    routeId: 'route_1',
    amount: '10.50',
    planId: 'pro',
    cycle: 'yearly',
    employees: '100'
  }

  if (kind === 'component') {
    await safeCall(`${label} attached`, () => definition.lifetimes?.attached?.call(instance))
  } else {
    await safeCall(`${label} onLoad`, () => instance.onLoad?.(options))
    await safeCall(`${label} onShow`, () => instance.onShow?.())
  }

  for (const handler of handlers) {
    if (typeof instance[handler] !== 'function') {
      failures.push(`${relative(root, wxmlFile)} -> ${handler}: not callable`)
      continue
    }
    checkedHandlers += 1
    await safeCall(`${label} ${handler}`, () => instance[handler](createEvent(handler)))
  }
}

const wxmlFiles = await collectFiles(miniprogramRoot, '.wxml')

for (const file of wxmlFiles) {
  await smokeFile(file)
}

await waitMicrotasks()

if (asyncFailures.length) {
  for (const error of asyncFailures) {
    failures.push(`async: ${error && error.stack ? error.stack : error}`)
  }
}

if (failures.length) {
  console.error(`Miniprogram event smoke failed (${failures.length}):`)
  console.error(failures.join('\n\n'))
  process.exit(1)
}

console.log(`miniprogram event smoke ok (${wxmlFiles.length} wxml files, ${checkedHandlers} handlers)`)
