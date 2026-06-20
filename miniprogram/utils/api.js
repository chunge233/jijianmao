const { request } = require('./request')

function queryString(params) {
  return params ? Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== '')
    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
    .join('&') : ''
}

const api = {
  wxLogin(data) {
    return request({ url: '/api/auth/wx-login', method: 'POST', data })
  },

  sendSmsCode(phone) {
    return request({ url: '/api/sms/send', method: 'POST', data: { phone } })
  },

  getSmsCountdown(phone) {
    return request({ url: `/api/sms/countdown?phone=${encodeURIComponent(phone)}` })
  },

  loginBySms(data) {
    return request({ url: '/api/auth/login/sms', method: 'POST', data })
  },

  getMe() {
    return request({ url: '/api/me' })
  },

  updateMe(data) {
    return request({ url: '/api/me', method: 'PATCH', data })
  },

  resetPassword(data) {
    return request({ url: '/api/account/reset-password', method: 'POST', data })
  },

  cancelAccount() {
    return request({ url: '/api/account/cancel', method: 'POST', data: {} })
  },

  clearCache() {
    return request({ url: '/api/cache/clear', method: 'POST', data: {} })
  },

  getDashboardOverview() {
    return request({ url: '/api/dashboard/overview' })
  },

  getBossDashboard() {
    return request({ url: '/api/dashboard/boss' })
  },

  getCurrentFactory() {
    return request({ url: '/api/factories/current' })
  },

  getFactories() {
    return request({ url: '/api/factories' })
  },

  getFactorySummary() {
    return request({ url: '/api/factories/current/summary' })
  },

  updateFactory(data) {
    return request({ url: '/api/factories/current', method: 'PATCH', data })
  },

  createFactory(data) {
    return request({ url: '/api/factories', method: 'POST', data })
  },

  joinFactory(inviteCode) {
    return request({ url: '/api/factories/join', method: 'POST', data: { inviteCode } })
  },

  switchFactory(id) {
    return request({ url: `/api/factories/${id}/switch`, method: 'POST', data: {} })
  },

  exitCurrentFactory() {
    return request({ url: '/api/factories/current/exit', method: 'POST', data: {} })
  },

  getEmployees() {
    return request({ url: '/api/employees' })
  },

  getEmployee(id) {
    return request({ url: `/api/employees/${id}` })
  },

  createEmployee(data) {
    return request({ url: '/api/employees', method: 'POST', data })
  },

  updateEmployee(id, data) {
    return request({ url: `/api/employees/${id}`, method: 'PATCH', data })
  },

  disableEmployee(id) {
    return request({ url: `/api/employees/${id}/disable`, method: 'POST', data: {} })
  },

  previewEmployeeImport() {
    return request({ url: '/api/employee-imports/preview', method: 'POST', data: {} })
  },

  getEmployeeImport(id) {
    return request({ url: `/api/employee-imports/${id}` })
  },

  confirmEmployeeImport(id) {
    return request({ url: `/api/employee-imports/${id}/confirm`, method: 'POST', data: {} })
  },

  getProcesses() {
    return request({ url: '/api/processes' })
  },

  getProcess(id) {
    return request({ url: `/api/processes/${id}` })
  },

  createProcess(data) {
    return request({ url: '/api/processes', method: 'POST', data })
  },

  updateProcess(id, data) {
    return request({ url: `/api/processes/${id}`, method: 'PATCH', data })
  },

  deleteProcess(id) {
    return request({ url: `/api/processes/${id}`, method: 'DELETE' })
  },

  getProducts() {
    return request({ url: '/api/products' })
  },

  getProduct(id) {
    return request({ url: `/api/products/${id}` })
  },

  createProduct(data) {
    return request({ url: '/api/products', method: 'POST', data })
  },

  updateProduct(id, data) {
    return request({ url: `/api/products/${id}`, method: 'PATCH', data })
  },

  deleteProduct(id) {
    return request({ url: `/api/products/${id}`, method: 'DELETE' })
  },

  getRoutes() {
    return request({ url: '/api/routes' })
  },

  getRoute(id) {
    return request({ url: `/api/routes/${id}` })
  },

  createRoute(data) {
    return request({ url: '/api/routes', method: 'POST', data })
  },

  updateRoute(id, data) {
    return request({ url: `/api/routes/${id}`, method: 'PATCH', data })
  },

  deleteRoute(id) {
    return request({ url: `/api/routes/${id}`, method: 'DELETE' })
  },

  resolveQr(payload) {
    return request({ url: `/api/qr/resolve?payload=${encodeURIComponent(payload)}` })
  },

  createReport(data) {
    return request({ url: '/api/reports', method: 'POST', data })
  },

  getReports(params) {
    const query = queryString(params)
    return request({ url: `/api/reports${query ? `?${query}` : ''}` })
  },

  getReportDrafts() {
    return request({ url: '/api/report-drafts' })
  },

  createReportDraft(data) {
    return request({ url: '/api/report-drafts', method: 'POST', data })
  },

  submitReportDraft(id) {
    return request({ url: `/api/report-drafts/${id}/submit`, method: 'POST', data: {} })
  },

  getReport(id) {
    return request({ url: `/api/reports/${id}` })
  },

  withdrawReport(id) {
    return request({ url: `/api/reports/${id}/withdraw`, method: 'POST', data: {} })
  },

  resubmitReport(id, remark) {
    return request({ url: `/api/reports/${id}/resubmit`, method: 'POST', data: { remark } })
  },

  getPendingAudits() {
    return request({ url: '/api/audits/pending' })
  },

  approveReport(reportId) {
    return request({ url: `/api/audits/${reportId}/approve`, method: 'POST', data: {} })
  },

  rejectReport(reportId, reason) {
    return request({ url: `/api/audits/${reportId}/reject`, method: 'POST', data: { reason } })
  },

  getSalaryMonths(params) {
    const query = queryString(params)
    return request({ url: `/api/salaries/months${query ? `?${query}` : ''}` })
  },

  getSalaryMonth(month, params) {
    const query = queryString(params)
    return request({ url: `/api/salaries/${month}${query ? `?${query}` : ''}` })
  },

  getSalaryConfirmations(month) {
    return request({ url: `/api/salaries/${month}/confirmations` })
  },

  confirmSalary(month) {
    return request({ url: `/api/salaries/${month}/confirm`, method: 'POST', data: {} })
  },

  disputeSalary(month, reason) {
    return request({ url: `/api/salaries/${month}/dispute`, method: 'POST', data: { reason } })
  },

  getPlans() {
    return request({ url: '/api/subscription/plans' })
  },

  getCurrentSubscription() {
    return request({ url: '/api/subscription/current' })
  },

  createPaymentOrder(data) {
    return request({ url: '/api/payment/orders', method: 'POST', data })
  },

  confirmPaymentOrder(orderId) {
    return request({ url: '/api/payment/wechat/notify', method: 'POST', data: { orderId } })
  },

  getBills() {
    return request({ url: '/api/bills' })
  },

  applyInvoice(billId) {
    return request({ url: '/api/invoices', method: 'POST', data: { billId } })
  },

  getMessages(params) {
    const query = queryString(params)
    return request({ url: `/api/messages${query ? `?${query}` : ''}` })
  },

  getMessage(id) {
    return request({ url: `/api/messages/${id}` })
  },

  readMessage(id) {
    return request({ url: `/api/messages/${id}/read`, method: 'POST', data: {} })
  },

  readAllMessages() {
    return request({ url: '/api/messages/read-all', method: 'POST', data: {} })
  },

  getAnnouncements() {
    return request({ url: '/api/announcements' })
  },

  getAnnouncement(id) {
    return request({ url: `/api/announcements/${id}` })
  },

  createAnnouncement(data) {
    return request({ url: '/api/announcements', method: 'POST', data })
  },

  updateAnnouncement(id, data) {
    return request({ url: `/api/announcements/${id}`, method: 'PATCH', data })
  },

  deleteAnnouncement(id) {
    return request({ url: `/api/announcements/${id}`, method: 'DELETE' })
  },

  getRoles() {
    return request({ url: '/api/roles' })
  },

  getRole(id) {
    return request({ url: `/api/roles/${id}` })
  },

  createRole(data) {
    return request({ url: '/api/roles', method: 'POST', data })
  },

  getAuditLogs(params) {
    const query = queryString(params)
    return request({ url: `/api/audit-logs${query ? `?${query}` : ''}` })
  },

  getAuditLog(id) {
    return request({ url: `/api/audit-logs/${id}` })
  },

  getBackups() {
    return request({ url: '/api/backups' })
  },

  createBackup() {
    return request({ url: '/api/backups', method: 'POST', data: {} })
  },

  restoreBackup(id) {
    return request({ url: `/api/backups/${id}/restore`, method: 'POST', data: {} })
  },

  getExports() {
    return request({ url: '/api/exports' })
  },

  createExport(type) {
    return request({ url: '/api/exports', method: 'POST', data: { type } })
  },

  getPriceAdjustments() {
    return request({ url: '/api/price-adjustments' })
  },

  createPriceAdjustment(items) {
    return request({ url: '/api/price-adjustments', method: 'POST', data: { items } })
  },

  confirmPriceAdjustment(id) {
    return request({ url: `/api/price-adjustments/${id}/confirm`, method: 'POST', data: {} })
  },

  getTeams() {
    return request({ url: '/api/teams' })
  },

  createTeam(data) {
    return request({ url: '/api/teams', method: 'POST', data })
  },

  createInvitation(data) {
    return request({ url: '/api/invitations', method: 'POST', data })
  },

  getJoinApplications() {
    return request({ url: '/api/join-applications' })
  },

  approveJoinApplication(id) {
    return request({ url: `/api/join-applications/${id}/approve`, method: 'POST', data: {} })
  },

  rejectJoinApplication(id) {
    return request({ url: `/api/join-applications/${id}/reject`, method: 'POST', data: {} })
  },

  submitFeedback(content) {
    return request({ url: '/api/feedback', method: 'POST', data: { content } })
  },

  getNotificationPreferences() {
    return request({ url: '/api/notification-preferences' })
  },

  updateNotificationPreferences(data) {
    return request({ url: '/api/notification-preferences', method: 'PATCH', data })
  }
}

module.exports = api
