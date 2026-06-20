import { readdir, rm } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const storeFile = resolve(scriptDir, '../data/smoke-test-store.json')
process.env.STORE_FILE = storeFile
process.env.JWT_SECRET = process.env.JWT_SECRET || 'smoke-secret'
process.env.SMS_DEV_MODE = 'true'

async function cleanupStoreFiles() {
  const storeDir = dirname(storeFile)
  const temporaryPrefix = `${basename(storeFile)}.`

  await rm(storeFile, { force: true })
  await rm(`${storeFile}.tmp`, { force: true })

  const names = await readdir(storeDir).catch(() => [])
  await Promise.all(
    names
      .filter((name) => name.startsWith(temporaryPrefix) && name.endsWith('.tmp'))
      .map((name) => rm(resolve(storeDir, name), { force: true }))
  )
}

await cleanupStoreFiles()

const { buildApp } = await import('../dist/app.js')

async function startApp(port) {
  const app = await buildApp()
  await app.listen({ port, host: '127.0.0.1' })
  return app
}

function createClient(baseUrl) {
  let token = ''

  return {
    setToken(nextToken) {
      token = nextToken
    },

    async request(path, options = {}) {
      const headers = {
        ...(options.headers || {})
      }

      if (options.body !== undefined && !headers['content-type']) {
        headers['content-type'] = 'application/json'
      }

      if (token) {
        headers.authorization = `Bearer ${token}`
      }

      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers
      })
      const text = await response.text()
      const data = text ? JSON.parse(text) : null

      if (!response.ok) {
        throw new Error(`${response.status} ${path}: ${text}`)
      }

      return data
    }
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

let app = await startApp(3351)
let client = createClient('http://127.0.0.1:3351')
let token = ''
let createdProductId = ''
let createdReportId = ''

try {
  const health = await client.request('/health')
  assert(health.ok, 'health check failed')

  const verifySms = await client.request('/api/sms/send', {
    method: 'POST',
    body: JSON.stringify({ phone: '13600001111' })
  })
  const verifiedSms = await client.request('/api/sms/verify', {
    method: 'POST',
    body: JSON.stringify({ phone: '13600001111', code: verifySms.data.devCode })
  })
  assert(verifiedSms.data?.verified, 'sms verify failed')

  const wxLogin = await client.request('/api/auth/wx-login', {
    method: 'POST',
    body: JSON.stringify({ code: `smoke-wx-${Date.now()}`, nickname: '微信新用户' })
  })
  assert(wxLogin.token && wxLogin.needsFactory && !wxLogin.factory, 'new wx login should require explicit factory selection')
  client.setToken(wxLogin.token)
  const wxMe = await client.request('/api/me')
  assert(wxMe.user && wxMe.needsFactory && !wxMe.factory, 'new wx user me should not include auto-created factory')
  client.setToken('')

  const cancelClient = createClient('http://127.0.0.1:3351')
  const cancelSms = await cancelClient.request('/api/sms/send', {
    method: 'POST',
    body: JSON.stringify({ phone: '13700002222' })
  })
  const cancelLogin = await cancelClient.request('/api/auth/login/sms', {
    method: 'POST',
    body: JSON.stringify({ phone: '13700002222', code: cancelSms.data.devCode, nickname: '注销用户' })
  })
  cancelClient.setToken(cancelLogin.token)
  const cancelFactory = await cancelClient.request('/api/factories', {
    method: 'POST',
    body: JSON.stringify({ name: '待注销工厂' })
  })
  cancelClient.setToken(cancelFactory.token)
  const cancelled = await cancelClient.request('/api/account/cancel', { method: 'POST', body: '{}' })
  assert(cancelled.ok, 'account cancel failed')
  const cancelledFactories = await cancelClient.request('/api/factories')
  assert(cancelledFactories.length === 0, 'cancelled user should not keep active factory memberships')

  const registeredSms = await client.request('/api/sms/send', {
    method: 'POST',
    body: JSON.stringify({ phone: '13700001111' })
  })
  assert(registeredSms.data?.devCode, 'sms send missing dev code')
  const registeredLogin = await client.request('/api/auth/login/sms', {
    method: 'POST',
    body: JSON.stringify({ phone: '13700001111', code: registeredSms.data.devCode, nickname: '新注册用户' })
  })
  assert(registeredLogin.token && registeredLogin.needsFactory && !registeredLogin.factory, 'new sms login should require explicit factory selection')
  client.setToken(registeredLogin.token)
  const newUserMe = await client.request('/api/me')
  assert(newUserMe.user && newUserMe.needsFactory && !newUserMe.factory, 'new user me should not include auto-created factory')
  const createdFactory = await client.request('/api/factories', {
    method: 'POST',
    body: JSON.stringify({ name: '冒烟新工厂' })
  })
  assert(createdFactory.token && createdFactory.factory.name === '冒烟新工厂', 'factory create should return switched token')
  client.setToken(createdFactory.token)
  const joinedFactory = await client.request('/api/factories/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCode: 'JJM-6288' })
  })
  assert(joinedFactory.token && joinedFactory.factory.id === 'factory_demo', 'factory join should return switched token')
  client.setToken(joinedFactory.token)
  const currentFactory = await client.request('/api/factories/current')
  assert(currentFactory.id === 'factory_demo', 'current factory should be joined demo factory')
  const updatedFactory = await client.request('/api/factories/current', {
    method: 'PATCH',
    body: JSON.stringify({ name: '示例五金厂' })
  })
  assert(updatedFactory.name === '示例五金厂', 'factory update failed')
  const exitFactory = await client.request('/api/factories', {
    method: 'POST',
    body: JSON.stringify({ name: '冒烟退出工厂' })
  })
  client.setToken(exitFactory.token)
  const exitedFactory = await client.request('/api/factories/current/exit', { method: 'POST', body: '{}' })
  assert(exitedFactory.ok, 'factory exit failed')
  const afterExitFactories = await client.request('/api/factories')
  assert(!afterExitFactories.some((factory) => factory.id === exitFactory.factory.id), 'exited factory should not stay active')
  const backToDemo = await client.request('/api/factories/factory_demo/switch', { method: 'POST', body: '{}' })
  assert(backToDemo.token && backToDemo.factory.id === 'factory_demo', 'switch back to demo factory failed')
  client.setToken(backToDemo.token)

  const sms = await client.request('/api/sms/send', {
    method: 'POST',
    body: JSON.stringify({ phone: '13500000000' })
  })
  assert(sms.data?.devCode, 'demo sms send missing dev code')
  const countdown = await client.request('/api/sms/countdown?phone=13500000000')
  assert(countdown.data && countdown.data.waitSeconds > 0, 'sms countdown failed')

  const login = await client.request('/api/auth/login/sms', {
    method: 'POST',
    body: JSON.stringify({ phone: '13500000000', code: sms.data.devCode, nickname: '冒烟用户' })
  })
  token = login.token
  client.setToken(token)

  const me = await client.request('/api/me')
  assert(me.user && me.factory, 'me endpoint missing user or factory')
  const overview = await client.request('/api/dashboard/overview')
  assert(typeof overview.reportCount === 'number', 'dashboard overview invalid')

  await client.request('/api/me', {
    method: 'PATCH',
    body: JSON.stringify({ nickname: '冒烟用户更新', phone: '13800009999' })
  })
  await client.request('/api/account/reset-password', { method: 'POST', body: '{}' })
  await client.request('/api/cache/clear', { method: 'POST', body: '{}' })

  const factorySummary = await client.request('/api/factories/current/summary')
  assert(factorySummary.stats.processes > 0, 'factory summary missing processes')
  const factories = await client.request('/api/factories')
  assert(factories.length > 0, 'factory list empty')
  const switched = await client.request(`/api/factories/${factories[0].id}/switch`, { method: 'POST', body: '{}' })
  assert(switched.token, 'factory switch missing token')
  client.setToken(switched.token)
  token = switched.token

  const employee = await client.request('/api/employees', {
    method: 'POST',
    body: JSON.stringify({ name: '冒烟员工', phone: '13900009999', role: 'employee' })
  })
  assert(employee.id, 'employee create failed')
  const employees = await client.request('/api/employees')
  assert(employees.some((item) => item.id === employee.id), 'employee list should include created employee')
  await client.request(`/api/employees/${employee.id}`)
  const updatedEmployee = await client.request(`/api/employees/${employee.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name: '冒烟员工2' })
  })
  assert(updatedEmployee.name === '冒烟员工2', 'employee update failed')
  const disabledEmployee = await client.request(`/api/employees/${employee.id}/disable`, { method: 'POST', body: '{}' })
  assert(disabledEmployee.ok, 'employee disable failed')

  const processItem = await client.request('/api/processes', {
    method: 'POST',
    body: JSON.stringify({ name: '冒烟工序', priceCents: 66 })
  })
  assert(processItem.id, 'process create failed')
  const processes = await client.request('/api/processes')
  assert(processes.some((item) => item.id === processItem.id), 'process list should include created process')
  await client.request(`/api/processes/${processItem.id}`)
  const updatedProcess = await client.request(`/api/processes/${processItem.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name: '冒烟工序2', priceCents: 77 })
  })
  assert(updatedProcess.name === '冒烟工序2' && updatedProcess.priceCents === 77, 'process update failed')
  const processToDelete = await client.request('/api/processes', {
    method: 'POST',
    body: JSON.stringify({ name: '冒烟停用工序', priceCents: 55 })
  })
  const deletedProcess = await client.request(`/api/processes/${processToDelete.id}`, { method: 'DELETE' })
  assert(deletedProcess.ok, 'process delete failed')
  const deletedProcessDetail = await client.request(`/api/processes/${processToDelete.id}`)
  assert(deletedProcessDetail.status === 'disabled', 'process delete should mark disabled')

  const productsBefore = await client.request('/api/products')
  assert(Array.isArray(productsBefore), 'product list invalid')
  const product = await client.request('/api/products', {
    method: 'POST',
    body: JSON.stringify({ name: '冒烟产品', code: 'P-SMOKE' })
  })
  createdProductId = product.id
  assert(product.id, 'product create failed')
  const productDetail = await client.request(`/api/products/${product.id}`)
  assert(productDetail.id === product.id, 'product detail failed')
  const updatedProduct = await client.request(`/api/products/${product.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name: '冒烟产品2', code: 'P-SMOKE-2' })
  })
  assert(updatedProduct.name === '冒烟产品2', 'product update failed')
  const deletedProduct = await client.request(`/api/products/${product.id}`, { method: 'DELETE' })
  assert(deletedProduct.ok, 'product delete failed')
  const deletedProductDetail = await client.request(`/api/products/${product.id}`)
  assert(deletedProductDetail.status === 'disabled', 'product delete should mark disabled')

  const route = await client.request('/api/routes', {
    method: 'POST',
    body: JSON.stringify({ name: '冒烟路线', processIds: ['quality', processItem.id] })
  })
  assert(route.id, 'route create failed')
  const routes = await client.request('/api/routes')
  assert(routes.some((item) => item.id === route.id), 'route list should include created route')
  await client.request(`/api/routes/${route.id}`)
  const updatedRoute = await client.request(`/api/routes/${route.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name: '冒烟路线2', processIds: ['quality'] })
  })
  assert(updatedRoute.name === '冒烟路线2' && updatedRoute.steps.length === 1, 'route update failed')
  const routeToDelete = await client.request('/api/routes', {
    method: 'POST',
    body: JSON.stringify({ name: '冒烟停用路线', processIds: ['quality'] })
  })
  const deletedRoute = await client.request(`/api/routes/${routeToDelete.id}`, { method: 'DELETE' })
  assert(deletedRoute.ok, 'route delete failed')
  const deletedRouteDetail = await client.request(`/api/routes/${routeToDelete.id}`)
  assert(deletedRouteDetail.status === 'disabled', 'route delete should mark disabled')

  const qrProcess = await client.request('/api/qr/resolve?payload=PJ-QC-001')
  const qrRoute = await client.request('/api/qr/resolve?payload=RT-PARTS-001')
  assert(qrProcess.type === 'process' && qrRoute.type === 'route', 'qr resolve failed')

  const report = await client.request('/api/reports', {
    method: 'POST',
    body: JSON.stringify({ type: 'process', items: [{ processId: 'quality', quantity: 5 }], remark: 'smoke report' })
  })
  createdReportId = report.id
  assert(report.id, 'report create failed')
  const reportDetail = await client.request(`/api/reports/${report.id}`)
  assert(reportDetail.id === report.id, 'report detail failed')
  const pendingAudits = await client.request('/api/audits/pending')
  assert(pendingAudits.some((item) => item.id === report.id), 'pending audits should include new report')
  await client.request(`/api/audits/${report.id}/approve`, { method: 'POST', body: '{}' })

  const draft = await client.request('/api/report-drafts', {
    method: 'POST',
    body: JSON.stringify({ type: 'process', items: [{ processId: 'quality', quantity: 2 }], remark: 'smoke draft' })
  })
  const drafts = await client.request('/api/report-drafts')
  assert(drafts.some((item) => item.id === draft.id), 'draft list should include created draft')
  const submittedDraft = await client.request(`/api/report-drafts/${draft.id}/submit`, { method: 'POST', body: '{}' })
  assert(submittedDraft.report.id, 'draft submit failed')
  await client.request(`/api/audits/${submittedDraft.report.id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason: 'smoke reject' })
  })
  await client.request(`/api/reports/${submittedDraft.report.id}/resubmit`, {
    method: 'POST',
    body: JSON.stringify({ remark: 'smoke resubmit' })
  })
  await client.request(`/api/reports/${submittedDraft.report.id}/withdraw`, { method: 'POST', body: '{}' })

  const months = await client.request('/api/salaries/months')
  assert(months.length > 0, 'salary months empty')
  const factoryMonths = await client.request('/api/salaries/months?scope=factory')
  assert(factoryMonths.length > 0, 'factory salary months empty')
  await client.request('/api/salaries/2026-06')
  const factorySalaryMonth = await client.request('/api/salaries/2026-06?scope=factory')
  assert(Array.isArray(factorySalaryMonth.items), 'factory salary month invalid')
  await client.request('/api/salaries/2026-06/confirmations')
  await client.request('/api/salaries/2026-06/confirm', { method: 'POST', body: '{}' })
  await client.request('/api/salaries/2026-06/dispute', {
    method: 'POST',
    body: JSON.stringify({ reason: 'smoke dispute' })
  })

  const order = await client.request('/api/payment/orders', {
    method: 'POST',
    body: JSON.stringify({ planId: 'pro', cycle: 'yearly' })
  })
  const plans = await client.request('/api/subscription/plans')
  assert(plans.length > 0, 'subscription plans empty')
  const currentSubscription = await client.request('/api/subscription/current')
  assert(currentSubscription && currentSubscription.factoryId, 'current subscription missing')
  await client.request('/api/payment/wechat/notify', {
    method: 'POST',
    body: JSON.stringify({ orderId: order.order.id })
  })
  const bills = await client.request('/api/bills')
  assert(bills.length > 0, 'bills empty')
  await client.request('/api/invoices', {
    method: 'POST',
    body: JSON.stringify({ billId: bills[0].id })
  })

  const announcement = await client.request('/api/announcements', {
    method: 'POST',
    body: JSON.stringify({ title: '冒烟公告', content: '接口正常' })
  })
  const announcements = await client.request('/api/announcements')
  assert(announcements.some((item) => item.id === announcement.id), 'announcement list should include created announcement')
  await client.request(`/api/announcements/${announcement.id}`)
  const updatedAnnouncement = await client.request(`/api/announcements/${announcement.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title: '冒烟公告更新', content: '接口更新正常', status: 'published' })
  })
  assert(updatedAnnouncement.title === '冒烟公告更新', 'announcement update failed')
  const deletedAnnouncement = await client.request(`/api/announcements/${announcement.id}`, { method: 'DELETE' })
  assert(deletedAnnouncement.ok, 'announcement delete failed')

  const roles = await client.request('/api/roles')
  assert(roles.length > 0, 'roles empty')
  await client.request(`/api/roles/${roles[0].id}`)
  await client.request('/api/roles', {
    method: 'POST',
    body: JSON.stringify({ name: '冒烟角色' })
  })

  const backupsBefore = await client.request('/api/backups')
  assert(Array.isArray(backupsBefore), 'backup list invalid')
  const backup = await client.request('/api/backups', { method: 'POST', body: '{}' })
  await client.request(`/api/backups/${backup.id}/restore`, { method: 'POST', body: '{}' })
  const exportJob = await client.request('/api/exports', {
    method: 'POST',
    body: JSON.stringify({ type: '报工记录' })
  })
  const exports = await client.request('/api/exports')
  assert(exports.some((item) => item.id === exportJob.id), 'export list should include created export')
  const adjustment = await client.request('/api/price-adjustments', {
    method: 'POST',
    body: JSON.stringify({ items: [{ processId: 'quality', newPriceCents: 36 }] })
  })
  const adjustments = await client.request('/api/price-adjustments')
  assert(adjustments.some((item) => item.id === adjustment.id), 'price adjustment list should include created adjustment')
  await client.request(`/api/price-adjustments/${adjustment.id}/confirm`, { method: 'POST', body: '{}' })

  const team = await client.request('/api/teams', {
    method: 'POST',
    body: JSON.stringify({ name: '冒烟班组', leader: '班长' })
  })
  assert(team.id, 'team create failed')
  const teams = await client.request('/api/teams')
  assert(teams.some((item) => item.id === team.id), 'team list should include created team')
  const invitation = await client.request('/api/invitations', {
    method: 'POST',
    body: JSON.stringify({ name: '冒烟成员', phone: '13900008888', role: 'employee' })
  })
  const joinApplications = await client.request('/api/join-applications')
  assert(joinApplications.some((item) => item.id === invitation.application.id), 'join applications should include invitation')
  await client.request(`/api/join-applications/${invitation.application.id}/approve`, { method: 'POST', body: '{}' })
  const rejectInvitation = await client.request('/api/invitations', {
    method: 'POST',
    body: JSON.stringify({ name: '拒绝成员', phone: '13900007777', role: 'employee' })
  })
  const rejectedApplication = await client.request(`/api/join-applications/${rejectInvitation.application.id}/reject`, { method: 'POST', body: '{}' })
  assert(rejectedApplication.application.status === 'rejected', 'join application reject failed')

  const importJob = await client.request('/api/employee-imports/preview', { method: 'POST', body: '{}' })
  await client.request(`/api/employee-imports/${importJob.id}`)
  await client.request(`/api/employee-imports/${importJob.id}/confirm`, { method: 'POST', body: '{}' })

  await client.request('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({ content: '冒烟反馈' })
  })
  const preferences = await client.request('/api/notification-preferences')
  await client.request('/api/notification-preferences', {
    method: 'PATCH',
    body: JSON.stringify({ ...preferences, system: false })
  })

  const messages = await client.request('/api/messages')
  assert(messages.length > 0, 'messages empty')
  await client.request(`/api/messages/${messages[0].id}`)
  const readMessage = await client.request(`/api/messages/${messages[0].id}/read`, { method: 'POST', body: '{}' })
  assert(readMessage.ok, 'message read failed')
  await client.request('/api/messages/read-all', { method: 'POST', body: '{}' })

  const bossDashboard = await client.request('/api/dashboard/boss')
  assert(typeof bossDashboard.reportCount === 'number', 'boss dashboard invalid')
  const auditLogs = await client.request('/api/audit-logs')
  assert(auditLogs.length > 0, 'audit logs empty')
  const auditLog = await client.request(`/api/audit-logs/${auditLogs[0].id}`)
  assert(auditLog.id === auditLogs[0].id, 'audit log detail failed')
} finally {
  await app.close()
}

app = await startApp(3352)
client = createClient('http://127.0.0.1:3352')
client.setToken(token)

try {
  const products = await client.request('/api/products')
  const reports = await client.request('/api/reports?mine=true')
  assert(products.some((item) => item.id === createdProductId), 'persisted product missing after restart')
  assert(reports.some((item) => item.id === createdReportId), 'persisted report missing after restart')
} finally {
  await app.close()
  await cleanupStoreFiles()
}

console.log('server smoke ok')
