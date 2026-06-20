import type { FastifyInstance } from 'fastify'
import { bodyOf, paramsOf, queryOf, requireAuth, toMoney } from './http.js'
import { getClientIp, getSmsCountdown, isValidPhone, normalizePhone, sendVerificationCode, verifySmsCode } from './sms.js'
import { createAuditLog, createMessage, currentFactoryForUser, getRouteSteps, id, now, store } from './store.js'
import type { AuthClaims, ReportItem, Role } from './types.js'

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function numberValue(value: unknown, fallback = 0) {
  const next = Number(value)
  return Number.isFinite(next) ? next : fallback
}

function requireFactory(claims: AuthClaims) {
  const factory = store.factories.find((item) => item.id === claims.factoryId)
  if (!factory) {
    throw new Error('FACTORY_NOT_FOUND')
  }
  return factory
}

function serializeProcess(processId: string) {
  const process = store.processes.find((item) => item.id === processId)
  if (!process) {
    return undefined
  }

  return {
    ...process,
    price: toMoney(process.priceCents)
  }
}

function serializeRoute(route: typeof store.routes[number]) {
  return {
    ...route,
    processes: getRouteSteps(route).map((process) => serializeProcess(process.id))
  }
}

function serializeReport(report: typeof store.reports[number]) {
  const user = store.users.find((item) => item.id === report.userId)
  const worker = user
    ? store.employees.find((item) => item.factoryId === report.factoryId && item.phone && item.phone === user.phone)
    : undefined

  return {
    ...report,
    workerName: worker?.name || user?.nickname || '未知员工',
    workerPhone: worker?.phone || user?.phone || '',
    total: toMoney(report.totalCents),
    items: report.items.map((item) => ({
      ...item,
      price: toMoney(item.priceCents),
      subtotal: toMoney(item.subtotalCents)
    }))
  }
}

function roleDefinitions(factoryId: string) {
  const employees = store.employees.filter((item) => item.factoryId === factoryId)
  const countByRole = (role: Role) => employees.filter((item) => item.role === role && item.status === 'active').length

  return [
    {
      id: 'boss',
      name: '管理员',
      role: 'boss' as Role,
      count: countByRole('boss') + countByRole('admin'),
      summary: '全部权限 · 工厂设置 · 数据查看',
      permissions: ['报工审核', '员工管理', '工序产品', '工资确认', '套餐订阅']
    },
    {
      id: 'admin',
      name: '组长',
      role: 'admin' as Role,
      count: countByRole('admin'),
      summary: '报工审核 · 员工管理 · 数据查看',
      permissions: ['报工审核', '员工管理', '工资查看']
    },
    {
      id: 'employee',
      name: '工人',
      role: 'employee' as Role,
      count: countByRole('employee'),
      summary: '报工 · 查看工资 · 提交异议',
      permissions: ['提交报工', '扫码报工', '查看工资', '提交异议']
    }
  ]
}

function signAuth(app: FastifyInstance, userId: string, factoryId = '', role: Role = 'employee') {
  return app.jwt.sign({ userId, factoryId, role } satisfies AuthClaims, { expiresIn: '7d' })
}

function roleForFactory(userIdValue: string, factoryIdValue: string): Role {
  const member = store.members.find((item) => item.userId === userIdValue && item.factoryId === factoryIdValue && item.status === 'active')
  return member?.role || 'employee'
}

function ensurePhoneUser(phone: string, nickname?: string) {
  let user = store.users.find((item) => item.phone === phone)

  if (!user) {
    const suffix = phone.slice(-4)
    user = {
      id: id('user'),
      openid: `phone-${phone}`,
      phone,
      nickname: stringValue(nickname, `用户${suffix}`)
    }
    store.users.push(user)
  }

  const factory = currentFactoryForUser(user.id)
  return {
    user,
    factory,
    role: factory ? roleForFactory(user.id, factory.id) : 'employee'
  }
}

function createOwnedFactory(userIdValue: string, name: string) {
  const user = store.users.find((item) => item.id === userIdValue)
  const factory = {
    id: id('factory'),
    name,
    ownerId: userIdValue,
    inviteCode: `JJM-${Math.floor(1000 + Math.random() * 9000)}`
  }
  store.factories.push(factory)
  store.members.push({
    id: id('member'),
    factoryId: factory.id,
    userId: userIdValue,
    role: 'boss',
    status: 'active'
  })
  store.employees.unshift({
    id: id('emp'),
    factoryId: factory.id,
    name: user?.nickname || '管理员',
    phone: user?.phone || '',
    role: 'boss',
    status: 'active'
  })
  store.subscriptions.unshift({
    id: id('sub'),
    factoryId: factory.id,
    planId: 'basic',
    planName: '基础版试用',
    status: 'trial',
    expireAt: trialExpireAt(),
    employeeLimit: 20
  })
  createMessage(factory.id, '欢迎使用计件猫', '请先创建工序、产品和工艺路线，再开始扫码报工。', 'system')
  createAuditLog(factory.id, '权限', '系统', '创建工厂', user?.phone || userIdValue)
  return factory
}

function ensureEmployeeForMember(factoryIdValue: string, userIdValue: string, role: Role) {
  const user = store.users.find((item) => item.id === userIdValue)
  if (!user || store.employees.some((item) => item.factoryId === factoryIdValue && item.phone && item.phone === user.phone)) {
    return
  }

  store.employees.unshift({
    id: id('emp'),
    factoryId: factoryIdValue,
    name: user.nickname || '新成员',
    phone: user.phone || '',
    role,
    status: 'active'
  })
}

function trialExpireAt() {
  const date = new Date()
  date.setDate(date.getDate() + 14)
  return date.toISOString()
}

function buildReportItems(rawItems: unknown): ReportItem[] {
  const items = Array.isArray(rawItems) ? rawItems : []

  return items.map((item) => {
    const source = item as Record<string, unknown>
    const processId = stringValue(source.processId)
    const process = store.processes.find((entry) => entry.id === processId)
    const quantity = Math.max(1, numberValue(source.quantity, 1))
    const priceCents = process ? process.priceCents : numberValue(source.priceCents, 0)
    const processName = process ? process.name : stringValue(source.processName, '未知工序')

    return {
      processId,
      processName,
      priceCents,
      quantity,
      subtotalCents: priceCents * quantity
    }
  }).filter((item) => item.processId && item.priceCents > 0)
}

export async function registerRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({
    ok: true,
    service: 'jijianmao-server',
    time: now()
  }))

  app.post('/api/sms/send', async (request, reply) => {
    const body = bodyOf<{ phone: string; phoneNumber: string }>(request)
    const query = queryOf<{ phone: string; phoneNumber: string }>(request)
    const phone = normalizePhone(body.phone || body.phoneNumber || query.phone || query.phoneNumber)

    if (!isValidPhone(phone)) {
      return reply.code(400).send({ success: false, message: '手机号格式不正确' })
    }

    const clientIp = getClientIp(request.headers as Record<string, unknown>, request.socket.remoteAddress)
    const result = await sendVerificationCode(phone, clientIp)
    if (!result.success) {
      return reply.code(400).send({ success: false, message: result.message, data: { waitSeconds: result.waitSeconds } })
    }

    return {
      success: true,
      message: result.message,
      data: {
        waitSeconds: result.waitSeconds,
        expireSeconds: result.expireSeconds,
        devCode: result.devCode
      }
    }
  })

  app.get('/api/sms/countdown', async (request, reply) => {
    const query = queryOf<{ phone: string; phoneNumber: string }>(request)
    const phone = normalizePhone(query.phone || query.phoneNumber)

    if (!isValidPhone(phone)) {
      return reply.code(400).send({ success: false, message: '手机号格式不正确' })
    }

    return {
      success: true,
      message: '获取成功',
      data: getSmsCountdown(phone)
    }
  })

  app.post('/api/sms/verify', async (request, reply) => {
    const body = bodyOf<{ phone: string; phoneNumber: string; code: string }>(request)
    const query = queryOf<{ phone: string; phoneNumber: string; code: string }>(request)
    const phone = normalizePhone(body.phone || body.phoneNumber || query.phone || query.phoneNumber)
    const code = stringValue(body.code || query.code)

    if (!isValidPhone(phone)) {
      return reply.code(400).send({ success: false, message: '手机号格式不正确' })
    }

    if (!/^\d{4,6}$/.test(code)) {
      return reply.code(400).send({ success: false, message: '验证码格式不正确' })
    }

    const result = verifySmsCode(phone, code)
    if (!result.success) {
      return reply.code(400).send({ success: false, message: result.message })
    }

    return { success: true, message: result.message, data: { verified: true } }
  })

  app.post('/api/auth/login/sms', async (request, reply) => {
    const body = bodyOf<{ phone: string; code: string; nickname: string }>(request)
    const phone = normalizePhone(body.phone)
    const code = stringValue(body.code)

    if (!isValidPhone(phone)) {
      return reply.code(400).send({ success: false, message: '手机号格式不正确' })
    }

    if (!/^\d{4,6}$/.test(code)) {
      return reply.code(400).send({ success: false, message: '验证码格式不正确' })
    }

    const verified = verifySmsCode(phone, code)
    if (!verified.success) {
      return reply.code(400).send({ success: false, message: verified.message })
    }

    const auth = ensurePhoneUser(phone, body.nickname)
    const token = signAuth(app, auth.user.id, auth.factory?.id || '', auth.role)
    const data = {
      token,
      accessToken: token,
      user: auth.user,
      factory: auth.factory || null,
      role: auth.role,
      needsFactory: !auth.factory,
      userId: auth.user.id,
      phone: auth.user.phone,
      nickname: auth.user.nickname,
      teamId: auth.factory?.id || '',
      teamName: auth.factory?.name || '',
      inviteCode: auth.factory?.inviteCode || ''
    }

    return {
      success: true,
      message: '登录成功',
      data,
      ...data
    }
  })

  app.post('/api/auth/wx-login', async (request) => {
    const body = bodyOf<{ code: string; phone: string; nickname: string }>(request)
    const code = stringValue(body.code, 'dev')
    const openid = process.env.WECHAT_APPID && process.env.WECHAT_SECRET
      ? `wx-${code}`
      : `mock-${code}`
    let user = store.users.find((item) => item.openid === openid)

    if (!user) {
      user = {
        id: id('user'),
        openid,
        phone: stringValue(body.phone),
        nickname: stringValue(body.nickname, '新员工')
      }
      store.users.push(user)
    }

    const factory = currentFactoryForUser(user.id)
    const role = factory ? roleForFactory(user.id, factory.id) : 'employee'
    const claims: AuthClaims = {
      userId: user.id,
      factoryId: factory?.id || '',
      role
    }
    const token = signAuth(app, claims.userId, claims.factoryId, claims.role)

    return {
      token,
      user,
      factory: factory || null,
      role: claims.role,
      needsFactory: !factory
    }
  })

  app.get('/api/me', async (request) => {
    const claims = await requireAuth(request)
    const user = store.users.find((item) => item.id === claims.userId)
    const factory = claims.factoryId
      ? store.factories.find((item) => item.id === claims.factoryId)
      : null
    return { user, factory: factory || null, role: claims.role, needsFactory: !factory }
  })

  app.patch('/api/me', async (request) => {
    const claims = await requireAuth(request)
    const body = bodyOf<{ nickname: string; phone: string; avatarUrl: string }>(request)
    const user = store.users.find((item) => item.id === claims.userId)

    if (!user) {
      return { ok: false, message: '用户不存在' }
    }

    user.nickname = stringValue(body.nickname, user.nickname)
    user.phone = stringValue(body.phone, user.phone || '')
    user.avatarUrl = stringValue(body.avatarUrl, user.avatarUrl || '')
    return { ok: true, user }
  })

  app.post('/api/account/reset-password', async (request) => {
    const claims = await requireAuth(request)
    createAuditLog(claims.factoryId, '权限', '当前用户', '重置登录密码', claims.userId)
    return { ok: true }
  })

  app.post('/api/account/cancel', async (request) => {
    const claims = await requireAuth(request)
    store.members.forEach((member) => {
      if (member.userId === claims.userId) {
        member.status = 'disabled'
      }
    })
    createAuditLog(claims.factoryId, '权限', '当前用户', '注销账号', claims.userId)
    return { ok: true }
  })

  app.post('/api/cache/clear', async (request) => {
    const claims = await requireAuth(request)
    createAuditLog(claims.factoryId, '数据', '当前用户', '清除本地缓存', '小程序缓存清理')
    return { ok: true, clearedSizeMb: 12.5 }
  })

  app.get('/api/dashboard/overview', async (request) => {
    const claims = await requireAuth(request)
    const reports = store.reports.filter((item) => item.factoryId === claims.factoryId)
    const myReports = reports.filter((item) => item.userId === claims.userId)
    const approvedReports = reports.filter((item) => item.status === 'approved' && item.userId === claims.userId)
    const totalCents = approvedReports.reduce((sum, item) => sum + item.totalCents, 0)
    const totalQuantity = approvedReports.reduce((sum, item) => sum + item.quantity, 0)
    const latestMessage = store.messages.find((item) => item.factoryId === claims.factoryId && (!item.userId || item.userId === claims.userId))

    return {
      month: '2026-06',
      salaryCents: totalCents,
      salary: toMoney(totalCents),
      reportCount: myReports.length,
      totalQuantity,
      pendingCount: reports.filter((item) => item.status === 'pending').length,
      latestMessage,
      recentReports: myReports.slice(0, 5).map(serializeReport)
    }
  })

  app.get('/api/dashboard/boss', async (request) => {
    const claims = await requireAuth(request)
    const reports = store.reports.filter((item) => item.factoryId === claims.factoryId)
    const approvedReports = reports.filter((item) => item.status === 'approved')
    const totalCents = approvedReports.reduce((sum, item) => sum + item.totalCents, 0)
    const totalQuantity = approvedReports.reduce((sum, item) => sum + item.quantity, 0)
    const employees = store.employees.filter((item) => item.factoryId === claims.factoryId && item.status === 'active')
    const processTotals = new Map<string, number>()

    approvedReports.forEach((report) => {
      report.items.forEach((item) => {
        processTotals.set(item.processName, (processTotals.get(item.processName) || 0) + item.quantity)
      })
    })

    return {
      month: '2026-06',
      totalCents,
      total: toMoney(totalCents),
      totalQuantity,
      reportCount: reports.length,
      employeeCount: employees.length,
      pendingCount: reports.filter((item) => item.status === 'pending').length,
      processRanking: Array.from(processTotals.entries()).map(([name, quantity]) => ({ name, quantity })).sort((a, b) => b.quantity - a.quantity)
    }
  })

  app.get('/api/factories/current', async (request) => {
    const claims = await requireAuth(request)
    return requireFactory(claims)
  })

  app.get('/api/factories', async (request) => {
    const claims = await requireAuth(request)
    const memberships = store.members.filter((item) => item.userId === claims.userId && item.status === 'active')

    return memberships.map((member) => {
      const factory = store.factories.find((item) => item.id === member.factoryId)
      return factory ? { ...factory, role: member.role, current: factory.id === claims.factoryId } : null
    }).filter(Boolean)
  })

  app.get('/api/factories/current/summary', async (request) => {
    const claims = await requireAuth(request)
    const factory = requireFactory(claims)

    return {
      factory,
      stats: {
        employees: store.employees.filter((item) => item.factoryId === claims.factoryId && item.status === 'active').length,
        processes: store.processes.filter((item) => item.factoryId === claims.factoryId && item.status === 'active').length,
        products: store.products.filter((item) => item.factoryId === claims.factoryId && item.status === 'active').length,
        routes: store.routes.filter((item) => item.factoryId === claims.factoryId && item.status === 'active').length
      }
    }
  })

  app.patch('/api/factories/current', async (request) => {
    const claims = await requireAuth(request)
    const body = bodyOf<{ name: string }>(request)
    const factory = requireFactory(claims)
    factory.name = stringValue(body.name, factory.name)
    return factory
  })

  app.post('/api/factories/:id/switch', async (request) => {
    const claims = await requireAuth(request)
    const { id: factoryIdValue } = paramsOf<{ id: string }>(request)
    const member = store.members.find((item) => item.factoryId === factoryIdValue && item.userId === claims.userId && item.status === 'active')
    const factory = member ? store.factories.find((item) => item.id === member.factoryId) : undefined

    if (!member || !factory) {
      return { ok: false, message: '无权切换到该工厂' }
    }

    const token = app.jwt.sign({ userId: claims.userId, factoryId: factory.id, role: member.role }, { expiresIn: '7d' })
    return { ok: true, token, factory, role: member.role }
  })

  app.post('/api/factories/current/exit', async (request) => {
    const claims = await requireAuth(request)
    const member = store.members.find((item) => item.factoryId === claims.factoryId && item.userId === claims.userId)

    if (member) {
      member.status = 'disabled'
      createAuditLog(claims.factoryId, '员工', '当前用户', '退出工厂', claims.userId)
    }

    return { ok: Boolean(member) }
  })

  app.post('/api/factories', async (request) => {
    const claims = await requireAuth(request)
    const body = bodyOf<{ name: string }>(request)
    const factory = createOwnedFactory(claims.userId, stringValue(body.name, '新工厂'))
    const token = signAuth(app, claims.userId, factory.id, 'boss')
    return { ok: true, token, factory, role: 'boss' }
  })

  app.post('/api/factories/join', async (request) => {
    const claims = await requireAuth(request)
    const body = bodyOf<{ inviteCode: string }>(request)
    const inviteCode = stringValue(body.inviteCode).toUpperCase()
    const factory = store.factories.find((item) => item.inviteCode.toUpperCase() === inviteCode)

    if (!factory) {
      return { ok: false, message: '邀请码不存在' }
    }

    let member = store.members.find((item) => item.factoryId === factory.id && item.userId === claims.userId)

    if (member) {
      member.status = 'active'
    } else {
      member = {
        id: id('member'),
        factoryId: factory.id,
        userId: claims.userId,
        role: 'employee',
        status: 'active'
      }
      store.members.push(member)
    }

    ensureEmployeeForMember(factory.id, claims.userId, member.role)
    const token = signAuth(app, claims.userId, factory.id, member.role)
    return { ok: true, token, factory, role: member.role }
  })

  app.get('/api/employees', async (request) => {
    const claims = await requireAuth(request)
    return store.employees.filter((item) => item.factoryId === claims.factoryId)
  })

  app.post('/api/employees', async (request, reply) => {
    const claims = await requireAuth(request)
    const body = bodyOf<{ name: string; phone: string; role: Role }>(request)
    const employee = {
      id: id('emp'),
      factoryId: claims.factoryId,
      name: stringValue(body.name, '新员工'),
      phone: stringValue(body.phone),
      role: (body.role as Role) || 'employee',
      status: 'active' as const
    }
    store.employees.unshift(employee)
    return reply.code(201).send(employee)
  })

  app.get('/api/employees/:id', async (request) => {
    const claims = await requireAuth(request)
    const { id: employeeId } = paramsOf<{ id: string }>(request)
    return store.employees.find((item) => item.id === employeeId && item.factoryId === claims.factoryId) || null
  })

  app.patch('/api/employees/:id', async (request) => {
    const claims = await requireAuth(request)
    const { id: employeeId } = paramsOf<{ id: string }>(request)
    const body = bodyOf<{ name: string; phone: string; role: Role }>(request)
    const employee = store.employees.find((item) => item.id === employeeId && item.factoryId === claims.factoryId)

    if (!employee) {
      return { ok: false, message: '员工不存在' }
    }

    employee.name = stringValue(body.name, employee.name)
    employee.phone = stringValue(body.phone, employee.phone || '')
    employee.role = (body.role as Role) || employee.role
    return employee
  })

  app.post('/api/employees/:id/disable', async (request) => {
    const claims = await requireAuth(request)
    const { id: employeeId } = paramsOf<{ id: string }>(request)
    const employee = store.employees.find((item) => item.id === employeeId && item.factoryId === claims.factoryId)

    if (employee) {
      employee.status = 'disabled'
    }

    return { ok: Boolean(employee) }
  })

  app.post('/api/employee-imports/preview', async (request, reply) => {
    const claims = await requireAuth(request)
    const rows = [
      { name: '导入员工A', phone: '13900000001', role: 'employee' as const },
      { name: '导入员工B', phone: '13900000002', role: 'employee' as const },
      { name: '导入组长', phone: '13900000003', role: 'admin' as const }
    ]
    const duplicate = rows.filter((row) => store.employees.some((employee) => employee.factoryId === claims.factoryId && employee.phone === row.phone)).length
    const job = {
      id: id('import'),
      factoryId: claims.factoryId,
      total: rows.length,
      valid: rows.length - duplicate,
      duplicate,
      invalid: 0,
      rows,
      status: 'preview' as const,
      createdAt: now()
    }
    store.employeeImports.unshift(job)
    return reply.code(201).send(job)
  })

  app.get('/api/employee-imports/:id', async (request) => {
    const claims = await requireAuth(request)
    const { id: importId } = paramsOf<{ id: string }>(request)
    return store.employeeImports.find((item) => item.id === importId && item.factoryId === claims.factoryId) || null
  })

  app.post('/api/employee-imports/:id/confirm', async (request) => {
    const claims = await requireAuth(request)
    const { id: importId } = paramsOf<{ id: string }>(request)
    const job = store.employeeImports.find((item) => item.id === importId && item.factoryId === claims.factoryId)

    if (!job) {
      return { ok: false, message: '导入任务不存在' }
    }

    job.rows.forEach((row) => {
      const existed = store.employees.some((employee) => employee.factoryId === claims.factoryId && employee.phone === row.phone)
      if (!existed) {
        store.employees.unshift({
          id: id('emp'),
          factoryId: claims.factoryId,
          name: row.name,
          phone: row.phone,
          role: row.role,
          status: 'active'
        })
      }
    })
    job.status = 'imported'
    createAuditLog(claims.factoryId, '员工', '管理员', '批量导入员工', `${job.valid} 人`)
    return { ok: true, imported: job.valid, job }
  })

  app.get('/api/processes', async (request) => {
    const claims = await requireAuth(request)
    return store.processes.filter((item) => item.factoryId === claims.factoryId).map((item) => ({
      ...item,
      price: toMoney(item.priceCents)
    }))
  })

  app.post('/api/processes', async (request, reply) => {
    const claims = await requireAuth(request)
    const body = bodyOf<{ name: string; priceCents: number }>(request)
    const process = {
      id: id('process'),
      factoryId: claims.factoryId,
      name: stringValue(body.name, '新工序'),
      priceCents: numberValue(body.priceCents, 0),
      qrCode: `PJ-${Date.now()}`,
      status: 'active' as const
    }
    store.processes.unshift(process)
    return reply.code(201).send(process)
  })

  app.get('/api/processes/:id', async (request) => {
    const claims = await requireAuth(request)
    const { id: processId } = paramsOf<{ id: string }>(request)
    const process = store.processes.find((item) => item.id === processId && item.factoryId === claims.factoryId)
    return process ? serializeProcess(process.id) : null
  })

  app.patch('/api/processes/:id', async (request) => {
    const claims = await requireAuth(request)
    const { id: processId } = paramsOf<{ id: string }>(request)
    const body = bodyOf<{ name: string; priceCents: number }>(request)
    const process = store.processes.find((item) => item.id === processId && item.factoryId === claims.factoryId)

    if (!process) {
      return { ok: false, message: '工序不存在' }
    }

    process.name = stringValue(body.name, process.name)
    process.priceCents = numberValue(body.priceCents, process.priceCents)
    return process
  })

  app.delete('/api/processes/:id', async (request) => {
    const claims = await requireAuth(request)
    const { id: processId } = paramsOf<{ id: string }>(request)
    const process = store.processes.find((item) => item.id === processId && item.factoryId === claims.factoryId)
    if (process) {
      process.status = 'disabled'
    }
    return { ok: Boolean(process) }
  })

  app.get('/api/products', async (request) => {
    const claims = await requireAuth(request)
    return store.products.filter((item) => item.factoryId === claims.factoryId)
  })

  app.post('/api/products', async (request, reply) => {
    const claims = await requireAuth(request)
    const body = bodyOf<{ name: string; code: string }>(request)
    const product = {
      id: id('product'),
      factoryId: claims.factoryId,
      name: stringValue(body.name, '新产品'),
      code: stringValue(body.code),
      status: 'active' as const
    }
    store.products.unshift(product)
    return reply.code(201).send(product)
  })

  app.get('/api/products/:id', async (request) => {
    const claims = await requireAuth(request)
    const { id: productId } = paramsOf<{ id: string }>(request)
    return store.products.find((item) => item.id === productId && item.factoryId === claims.factoryId) || null
  })

  app.patch('/api/products/:id', async (request) => {
    const claims = await requireAuth(request)
    const { id: productId } = paramsOf<{ id: string }>(request)
    const body = bodyOf<{ name: string; code: string }>(request)
    const product = store.products.find((item) => item.id === productId && item.factoryId === claims.factoryId)

    if (!product) {
      return { ok: false, message: '产品不存在' }
    }

    product.name = stringValue(body.name, product.name)
    product.code = stringValue(body.code, product.code || '')
    return product
  })

  app.delete('/api/products/:id', async (request) => {
    const claims = await requireAuth(request)
    const { id: productId } = paramsOf<{ id: string }>(request)
    const product = store.products.find((item) => item.id === productId && item.factoryId === claims.factoryId)

    if (product) {
      product.status = 'disabled'
    }

    return { ok: Boolean(product) }
  })

  app.get('/api/routes', async (request) => {
    const claims = await requireAuth(request)
    return store.routes.filter((item) => item.factoryId === claims.factoryId).map(serializeRoute)
  })

  app.get('/api/routes/:id', async (request) => {
    const claims = await requireAuth(request)
    const { id: routeId } = paramsOf<{ id: string }>(request)
    const route = store.routes.find((item) => item.id === routeId && item.factoryId === claims.factoryId)
    return route ? serializeRoute(route) : null
  })

  app.post('/api/routes', async (request, reply) => {
    const claims = await requireAuth(request)
    const body = bodyOf<{ name: string; processIds: string[] }>(request)
    const processIds = Array.isArray(body.processIds) ? body.processIds : []
    const route = {
      id: id('route'),
      factoryId: claims.factoryId,
      name: stringValue(body.name, '新工艺路线'),
      qrCode: `RT-${Date.now()}`,
      status: 'active' as const,
      steps: processIds.map((processId, index) => ({ processId, sort: index + 1 }))
    }
    store.routes.unshift(route)
    return reply.code(201).send(route)
  })

  app.patch('/api/routes/:id', async (request) => {
    const claims = await requireAuth(request)
    const { id: routeId } = paramsOf<{ id: string }>(request)
    const body = bodyOf<{ name: string; processIds: string[] }>(request)
    const route = store.routes.find((item) => item.id === routeId && item.factoryId === claims.factoryId)

    if (!route) {
      return { ok: false, message: '路线不存在' }
    }

    route.name = stringValue(body.name, route.name)
    if (Array.isArray(body.processIds)) {
      route.steps = body.processIds.map((processId, index) => ({ processId, sort: index + 1 }))
    }
    return route
  })

  app.delete('/api/routes/:id', async (request) => {
    const claims = await requireAuth(request)
    const { id: routeId } = paramsOf<{ id: string }>(request)
    const route = store.routes.find((item) => item.id === routeId && item.factoryId === claims.factoryId)

    if (route) {
      route.status = 'disabled'
    }

    return { ok: Boolean(route) }
  })

  app.get('/api/qr/resolve', async (request) => {
    const claims = await requireAuth(request)
    const query = queryOf<{ payload: string }>(request)
    const payload = stringValue(query.payload)
    const process = store.processes.find((item) => item.factoryId === claims.factoryId && (item.id === payload || item.qrCode === payload))

    if (process) {
      return { type: 'process', process: serializeProcess(process.id) }
    }

    const route = store.routes.find((item) => item.factoryId === claims.factoryId && (item.id === payload || item.qrCode === payload))

    if (route) {
      return {
        type: 'route',
        route: {
          ...route,
          processes: getRouteSteps(route).map((step) => serializeProcess(step.id))
        }
      }
    }

    return { type: 'unknown' }
  })

  app.post('/api/reports', async (request, reply) => {
    const claims = await requireAuth(request)
    const body = bodyOf<{ type: 'process' | 'route'; items: unknown[]; remark: string }>(request)
    const items = buildReportItems(body.items)
    const totalCents = items.reduce((sum, item) => sum + item.subtotalCents, 0)
    const quantity = items.reduce((sum, item) => sum + item.quantity, 0)
    const report = {
      id: id('report'),
      factoryId: claims.factoryId,
      userId: claims.userId,
      type: body.type || 'process',
      status: 'pending' as const,
      remark: stringValue(body.remark),
      totalCents,
      quantity,
      items,
      createdAt: now()
    }
    store.reports.unshift(report)
    createMessage(claims.factoryId, '有新的报工待审核', `${items.length} 道工序，共 ${quantity} 件。`, 'audit')
    return reply.code(201).send(report)
  })

  app.get('/api/report-drafts', async (request) => {
    const claims = await requireAuth(request)
    return store.reportDrafts.filter((item) => item.factoryId === claims.factoryId && item.userId === claims.userId)
  })

  app.post('/api/report-drafts', async (request, reply) => {
    const claims = await requireAuth(request)
    const body = bodyOf<{ type: 'process' | 'route'; items: unknown[]; remark: string }>(request)
    const draft = {
      id: id('draft'),
      factoryId: claims.factoryId,
      userId: claims.userId,
      type: body.type || 'process',
      items: buildReportItems(body.items),
      remark: stringValue(body.remark, '草稿报工'),
      createdAt: now()
    }
    store.reportDrafts.unshift(draft)
    return reply.code(201).send(draft)
  })

  app.post('/api/report-drafts/:id/submit', async (request, reply) => {
    const claims = await requireAuth(request)
    const { id: draftId } = paramsOf<{ id: string }>(request)
    const draft = store.reportDrafts.find((item) => item.id === draftId && item.factoryId === claims.factoryId && item.userId === claims.userId)

    if (!draft) {
      return { ok: false, message: '草稿不存在' }
    }

    const totalCents = draft.items.reduce((sum, item) => sum + item.subtotalCents, 0)
    const quantity = draft.items.reduce((sum, item) => sum + item.quantity, 0)
    const report = {
      id: id('report'),
      factoryId: claims.factoryId,
      userId: claims.userId,
      type: draft.type,
      status: 'pending' as const,
      remark: stringValue(draft.remark),
      totalCents,
      quantity,
      items: draft.items,
      createdAt: now()
    }
    store.reports.unshift(report)
    store.reportDrafts = store.reportDrafts.filter((item) => item.id !== draftId)
    createMessage(claims.factoryId, '草稿已提交审核', `${draft.items.length} 道工序，共 ${quantity} 件。`, 'audit')
    return reply.code(201).send({ ok: true, report: serializeReport(report) })
  })

  app.get('/api/reports', async (request) => {
    const claims = await requireAuth(request)
    const query = queryOf<{ status: string; mine: string }>(request)
    return store.reports.filter((report) => {
      if (report.factoryId !== claims.factoryId) return false
      if (query.mine === 'true' && report.userId !== claims.userId) return false
      if (query.status && report.status !== query.status) return false
      return true
    }).map(serializeReport)
  })

  app.get('/api/reports/:id', async (request) => {
    const claims = await requireAuth(request)
    const { id: reportId } = paramsOf<{ id: string }>(request)
    const report = store.reports.find((item) => item.id === reportId && item.factoryId === claims.factoryId)
    return report ? serializeReport(report) : null
  })

  app.post('/api/reports/:id/withdraw', async (request) => {
    const claims = await requireAuth(request)
    const { id: reportId } = paramsOf<{ id: string }>(request)
    const report = store.reports.find((item) => item.id === reportId && item.factoryId === claims.factoryId)
    if (report && report.status === 'pending') {
      report.status = 'withdrawn'
    }
    return { ok: Boolean(report), report }
  })

  app.post('/api/reports/:id/resubmit', async (request, reply) => {
    const claims = await requireAuth(request)
    const { id: reportId } = paramsOf<{ id: string }>(request)
    const body = bodyOf<{ remark: string }>(request)
    const report = store.reports.find((item) => item.id === reportId && item.factoryId === claims.factoryId && item.userId === claims.userId)

    if (!report) {
      return { ok: false, message: '报工记录不存在' }
    }

    report.status = 'pending'
    report.remark = stringValue(body.remark, report.remark || '重新提交')
    delete report.auditReason
    report.createdAt = now()
    createMessage(claims.factoryId, '报工已重新提交', `报工 ${report.id} 已重新进入审核。`, 'audit')
    return reply.code(201).send({ ok: true, report: serializeReport(report) })
  })

  app.get('/api/audits/pending', async (request) => {
    const claims = await requireAuth(request)
    return store.reports.filter((item) => item.factoryId === claims.factoryId && item.status === 'pending').map(serializeReport)
  })

  app.post('/api/audits/:reportId/approve', async (request) => {
    const claims = await requireAuth(request)
    const { reportId } = paramsOf<{ reportId: string }>(request)
    const report = store.reports.find((item) => item.id === reportId && item.factoryId === claims.factoryId)
    if (report) {
      report.status = 'approved'
      createMessage(claims.factoryId, '报工已通过', `报工 ${report.id} 已通过审核。`, 'audit')
    }
    return { ok: Boolean(report), report: report ? serializeReport(report) : null }
  })

  app.post('/api/audits/:reportId/reject', async (request) => {
    const claims = await requireAuth(request)
    const { reportId } = paramsOf<{ reportId: string }>(request)
    const body = bodyOf<{ reason: string }>(request)
    const report = store.reports.find((item) => item.id === reportId && item.factoryId === claims.factoryId)
    if (report) {
      report.status = 'rejected'
      report.auditReason = stringValue(body.reason, '数量或工序信息需要核对')
      createMessage(claims.factoryId, '报工被驳回', report.auditReason, 'audit')
    }
    return { ok: Boolean(report), report: report ? serializeReport(report) : null }
  })

  app.get('/api/salaries/months', async (request) => {
    const claims = await requireAuth(request)
    const query = queryOf<{ scope: string }>(request)
    const factoryScope = query.scope === 'factory'
    const approvedReports = store.reports.filter((item) => {
      if (item.factoryId !== claims.factoryId || item.status !== 'approved') return false
      return factoryScope || item.userId === claims.userId
    })
    const totalCents = approvedReports.reduce((sum, item) => sum + item.totalCents, 0)
    const quantity = approvedReports.reduce((sum, item) => sum + item.quantity, 0)
    const month = '2026-06'
    const confirmations = store.salaryConfirmations.filter((item) => item.factoryId === claims.factoryId && item.month === month)
    const confirmation = confirmations.find((item) => item.userId === claims.userId)
    const factoryUserIds = store.employees
      .filter((employee) => employee.factoryId === claims.factoryId && employee.status === 'active' && employee.phone)
      .map((employee) => store.users.find((user) => user.phone === employee.phone)?.id)
      .filter((userId): userId is string => Boolean(userId))
    const factoryStatus = confirmations.some((item) => item.status === 'disputed')
      ? 'disputed'
      : (
          factoryUserIds.length > 0 &&
          factoryUserIds.every((userId) => confirmations.some((item) => item.userId === userId && item.status === 'confirmed'))
            ? 'confirmed'
            : 'pending-confirm'
        )
    return [
      {
        month,
        totalCents,
        total: toMoney(totalCents),
        quantity,
        reportCount: approvedReports.length,
        status: factoryScope ? factoryStatus : (confirmation?.status || 'pending-confirm')
      }
    ]
  })

  app.get('/api/salaries/:month', async (request) => {
    const claims = await requireAuth(request)
    const { month } = paramsOf<{ month: string }>(request)
    const query = queryOf<{ scope: string }>(request)
    const factoryScope = query.scope === 'factory'
    const approvedReports = store.reports.filter((item) => {
      if (item.factoryId !== claims.factoryId || item.status !== 'approved') return false
      return factoryScope || item.userId === claims.userId
    })
    const items = approvedReports.flatMap((report) => report.items.map((item) => ({
      ...item,
      reportId: report.id,
      amount: toMoney(item.subtotalCents)
    })))
    const totalCents = items.reduce((sum, item) => sum + item.subtotalCents, 0)
    return { month, totalCents, total: toMoney(totalCents), items }
  })

  app.get('/api/salaries/:month/confirmations', async (request) => {
    const claims = await requireAuth(request)
    const { month } = paramsOf<{ month: string }>(request)
    const approvedReports = store.reports.filter((item) => item.factoryId === claims.factoryId && item.status === 'approved')
    const employees = store.employees.filter((item) => item.factoryId === claims.factoryId && item.status === 'active')
    const rows = employees.map((employee) => {
      const user = employee.phone
        ? store.users.find((item) => item.phone === employee.phone)
        : undefined
      const employeeReports = user
        ? approvedReports.filter((report) => report.userId === user.id)
        : []
      const confirmation = user
        ? store.salaryConfirmations.find((item) => item.factoryId === claims.factoryId && item.userId === user.id && item.month === month)
        : undefined
      const amountCents = employeeReports.reduce((sum, report) => sum + report.totalCents, 0)
      const quantity = employeeReports.reduce((sum, report) => sum + report.quantity, 0)
      const status = confirmation?.status === 'confirmed'
        ? '已确认'
        : (confirmation?.status === 'disputed' ? '异议中' : '待确认')

      return {
        id: employee.id,
        name: employee.name,
        team: employee.role === 'admin' ? '管理组' : '生产组',
        amountCents,
        quantity,
        reportCount: employeeReports.length,
        status,
        reason: confirmation?.reason || ''
      }
    })
    const confirmed = rows.filter((item) => item.status === '已确认').length
    const disputed = rows.filter((item) => item.status === '异议中').length

    return {
      month,
      total: rows.length,
      confirmed,
      disputed,
      progress: rows.length ? Math.round((confirmed / rows.length) * 100) : 0,
      employees: rows
    }
  })

  app.post('/api/salaries/:month/confirm', async (request) => {
    const claims = await requireAuth(request)
    const { month } = paramsOf<{ month: string }>(request)
    const existed = store.salaryConfirmations.find((item) => item.factoryId === claims.factoryId && item.userId === claims.userId && item.month === month)
    if (existed) {
      existed.status = 'confirmed'
      delete existed.reason
    } else {
      store.salaryConfirmations.push({ factoryId: claims.factoryId, userId: claims.userId, month: month || '2026-06', status: 'confirmed' })
    }
    createMessage(claims.factoryId, '工资已确认', `${month} 工资已确认。`, 'salary')
    return { ok: true, month, status: 'confirmed' }
  })

  app.post('/api/salaries/:month/dispute', async (request) => {
    const claims = await requireAuth(request)
    const { month } = paramsOf<{ month: string }>(request)
    const body = bodyOf<{ reason: string }>(request)
    const reason = stringValue(body.reason, `${month} 工资需要核对。`)
    const existed = store.salaryConfirmations.find((item) => item.factoryId === claims.factoryId && item.userId === claims.userId && item.month === month)
    if (existed) {
      existed.status = 'disputed'
      existed.reason = reason
    } else {
      store.salaryConfirmations.push({ factoryId: claims.factoryId, userId: claims.userId, month: month || '2026-06', status: 'disputed', reason })
    }
    createMessage(claims.factoryId, '工资异议待处理', reason, 'salary')
    return { ok: true, month, status: 'disputed' }
  })

  app.get('/api/subscription/current', async (request) => {
    const claims = await requireAuth(request)
    return store.subscriptions.find((item) => item.factoryId === claims.factoryId) || null
  })

  app.get('/api/subscription/plans', async () => store.plans)

  app.post('/api/payment/orders', async (request, reply) => {
    const claims = await requireAuth(request)
    const body = bodyOf<{ planId: string; cycle: 'monthly' | 'yearly' }>(request)
    const plan = store.plans.find((item) => item.id === body.planId) || store.plans[1]
    const cycle = body.cycle || 'yearly'
    const amountCents = cycle === 'yearly' ? plan.yearlyCents : plan.monthlyCents
    const order = {
      id: id('pay'),
      factoryId: claims.factoryId,
      planId: plan.id,
      planName: plan.name,
      amountCents,
      status: 'pending' as const,
      createdAt: now()
    }
    store.paymentOrders.unshift(order)
    return reply.code(201).send({
      order,
      wechatPayParams: {
        timeStamp: `${Math.floor(Date.now() / 1000)}`,
        nonceStr: order.id,
        package: `prepay_id=mock_${order.id}`,
        signType: 'RSA',
        paySign: 'mock-pay-sign'
      }
    })
  })

  app.post('/api/payment/wechat/notify', async (request) => {
    const body = bodyOf<{ orderId: string }>(request)
    const order = store.paymentOrders.find((item) => item.id === body.orderId) || store.paymentOrders[0]

    if (!order) {
      return { code: 'FAIL', message: 'ORDER_NOT_FOUND' }
    }

    order.status = 'paid'
    const plan = store.plans.find((item) => item.id === order.planId)
    const expireAt = new Date()
    expireAt.setFullYear(expireAt.getFullYear() + 1)
    const subscription = store.subscriptions.find((item) => item.factoryId === order.factoryId)
    if (subscription && plan) {
      subscription.planId = plan.id
      subscription.planName = plan.name
      subscription.status = 'active'
      subscription.expireAt = expireAt.toISOString()
      subscription.employeeLimit = plan.employeeLimit
    }
    store.bills.unshift({
      id: id('bill'),
      factoryId: order.factoryId,
      title: `${order.planName}订购`,
      amountCents: order.amountCents,
      status: 'paid',
      invoiceStatus: 'available',
      createdAt: now()
    })
    createMessage(order.factoryId, '套餐已开通', `${order.planName} 已开通。`, 'subscription')
    return { code: 'SUCCESS', message: '成功' }
  })

  app.get('/api/bills', async (request) => {
    const claims = await requireAuth(request)
    return store.bills.filter((item) => item.factoryId === claims.factoryId)
  })

  app.post('/api/invoices', async (request) => {
    await requireAuth(request)
    const body = bodyOf<{ billId: string }>(request)
    const bill = store.bills.find((item) => item.id === body.billId)
    if (bill && bill.invoiceStatus === 'available') {
      bill.invoiceStatus = 'applying'
    }
    return { ok: Boolean(bill), bill }
  })

  app.get('/api/messages', async (request) => {
    const claims = await requireAuth(request)
    const query = queryOf<{ type: string }>(request)
    return store.messages.filter((item) => {
      if (item.factoryId !== claims.factoryId) return false
      if (item.userId && item.userId !== claims.userId) return false
      if (query.type && item.type !== query.type) return false
      return true
    })
  })

  app.get('/api/messages/:id', async (request) => {
    const claims = await requireAuth(request)
    const { id: messageId } = paramsOf<{ id: string }>(request)
    const message = store.messages.find((item) => item.id === messageId && item.factoryId === claims.factoryId && (!item.userId || item.userId === claims.userId))

    if (message) {
      message.read = true
    }

    return message || null
  })

  app.post('/api/messages/:id/read', async (request) => {
    const claims = await requireAuth(request)
    const { id: messageId } = paramsOf<{ id: string }>(request)
    const message = store.messages.find((item) => item.id === messageId && item.factoryId === claims.factoryId && (!item.userId || item.userId === claims.userId))

    if (message) {
      message.read = true
    }

    return { ok: Boolean(message), message }
  })

  app.post('/api/messages/read-all', async (request) => {
    const claims = await requireAuth(request)
    store.messages.forEach((message) => {
      if (message.factoryId === claims.factoryId && (!message.userId || message.userId === claims.userId)) {
        message.read = true
      }
    })
    return { ok: true }
  })

  app.get('/api/announcements', async (request) => {
    const claims = await requireAuth(request)
    return store.announcements.filter((item) => item.factoryId === claims.factoryId)
  })

  app.get('/api/announcements/:id', async (request) => {
    const claims = await requireAuth(request)
    const { id: announcementId } = paramsOf<{ id: string }>(request)
    return store.announcements.find((item) => item.id === announcementId && item.factoryId === claims.factoryId) || null
  })

  app.post('/api/announcements', async (request, reply) => {
    const claims = await requireAuth(request)
    const body = bodyOf<{ title: string; content: string; status: 'published' | 'draft' }>(request)
    const announcement = {
      id: id('ann'),
      factoryId: claims.factoryId,
      title: stringValue(body.title, '新公告'),
      content: stringValue(body.content, '请查看最新通知。'),
      author: claims.role === 'employee' ? '员工' : '管理员',
      createdAt: now(),
      status: body.status || 'published'
    }
    store.announcements.unshift(announcement)
    createMessage(claims.factoryId, announcement.title, announcement.content, 'system')
    return reply.code(201).send(announcement)
  })

  app.patch('/api/announcements/:id', async (request) => {
    const claims = await requireAuth(request)
    const { id: announcementId } = paramsOf<{ id: string }>(request)
    const body = bodyOf<{ title: string; content: string; status: 'published' | 'draft' }>(request)
    const announcement = store.announcements.find((item) => item.id === announcementId && item.factoryId === claims.factoryId)

    if (!announcement) {
      return { ok: false, message: '公告不存在' }
    }

    announcement.title = stringValue(body.title, announcement.title)
    announcement.content = stringValue(body.content, announcement.content)
    announcement.status = body.status || announcement.status
    return announcement
  })

  app.delete('/api/announcements/:id', async (request) => {
    const claims = await requireAuth(request)
    const { id: announcementId } = paramsOf<{ id: string }>(request)
    const before = store.announcements.length
    store.announcements = store.announcements.filter((item) => !(item.id === announcementId && item.factoryId === claims.factoryId))
    return { ok: store.announcements.length !== before }
  })

  app.get('/api/roles', async (request) => {
    const claims = await requireAuth(request)
    return roleDefinitions(claims.factoryId)
  })

  app.get('/api/roles/:id', async (request) => {
    const claims = await requireAuth(request)
    const { id: roleId } = paramsOf<{ id: string }>(request)
    return roleDefinitions(claims.factoryId).find((item) => item.id === roleId || item.role === roleId) || null
  })

  app.post('/api/roles', async (request, reply) => {
    const claims = await requireAuth(request)
    const body = bodyOf<{ name: string }>(request)
    return reply.code(201).send({
      id: id('role'),
      name: stringValue(body.name, '自定义角色'),
      role: 'employee',
      count: 0,
      summary: '自定义权限 · MVP 演示角色',
      permissions: ['提交报工']
    })
  })

  app.get('/api/audit-logs', async (request) => {
    const claims = await requireAuth(request)
    const query = queryOf<{ category: string }>(request)
    return store.auditLogs.filter((item) => {
      if (item.factoryId !== claims.factoryId) return false
      if (query.category && query.category !== '全部' && item.category !== query.category) return false
      return true
    })
  })

  app.get('/api/audit-logs/:id', async (request) => {
    const claims = await requireAuth(request)
    const { id: logId } = paramsOf<{ id: string }>(request)
    return store.auditLogs.find((item) => item.id === logId && item.factoryId === claims.factoryId) || null
  })

  app.get('/api/backups', async (request) => {
    const claims = await requireAuth(request)
    return store.backups.filter((item) => item.factoryId === claims.factoryId)
  })

  app.post('/api/backups', async (request, reply) => {
    const claims = await requireAuth(request)
    const backup = {
      id: id('backup'),
      factoryId: claims.factoryId,
      date: '刚刚',
      size: `${(18 + Math.random()).toFixed(1)}MB`,
      status: '手动备份',
      createdAt: now()
    }
    store.backups.unshift(backup)
    createAuditLog(claims.factoryId, '数据', '管理员', '创建数据备份', `备份大小 ${backup.size}`)
    return reply.code(201).send(backup)
  })

  app.post('/api/backups/:id/restore', async (request) => {
    const claims = await requireAuth(request)
    const { id: backupId } = paramsOf<{ id: string }>(request)
    const backup = store.backups.find((item) => item.id === backupId && item.factoryId === claims.factoryId)

    if (backup) {
      createAuditLog(claims.factoryId, '数据', '管理员', '恢复数据备份', backup.date)
    }

    return { ok: Boolean(backup), backup }
  })

  app.get('/api/exports', async (request) => {
    const claims = await requireAuth(request)
    return store.exportJobs.filter((item) => item.factoryId === claims.factoryId)
  })

  app.post('/api/exports', async (request, reply) => {
    const claims = await requireAuth(request)
    const body = bodyOf<{ type: string }>(request)
    const type = stringValue(body.type, '工资报表')
    const exportJob = {
      id: id('export'),
      factoryId: claims.factoryId,
      name: `${type}_${Date.now()}.xlsx`,
      scope: `${type} · 已生成`,
      status: 'ready' as const,
      createdAt: now()
    }
    store.exportJobs.unshift(exportJob)
    createAuditLog(claims.factoryId, '数据', '管理员', '导出数据', exportJob.name)
    return reply.code(201).send(exportJob)
  })

  app.get('/api/price-adjustments', async (request) => {
    const claims = await requireAuth(request)
    return store.priceAdjustments.filter((item) => item.factoryId === claims.factoryId)
  })

  app.post('/api/price-adjustments', async (request, reply) => {
    const claims = await requireAuth(request)
    const body = bodyOf<{ items: Array<{ processId: string; newPriceCents: number }> }>(request)
    const items = Array.isArray(body.items) ? body.items : []
    const adjustment = {
      id: id('price'),
      factoryId: claims.factoryId,
      items: items.map((item) => {
        const process = store.processes.find((entry) => entry.id === item.processId && entry.factoryId === claims.factoryId)
        return {
          processId: item.processId,
          oldPriceCents: process?.priceCents || 0,
          newPriceCents: numberValue(item.newPriceCents, process?.priceCents || 0)
        }
      }).filter((item) => item.processId),
      status: 'pending' as const,
      createdAt: now()
    }
    store.priceAdjustments.unshift(adjustment)
    createAuditLog(claims.factoryId, '工价', '管理员', '发起批量调价', `${adjustment.items.length} 道工序`)
    return reply.code(201).send(adjustment)
  })

  app.post('/api/price-adjustments/:id/confirm', async (request) => {
    const claims = await requireAuth(request)
    const { id: adjustmentId } = paramsOf<{ id: string }>(request)
    const adjustment = store.priceAdjustments.find((item) => item.id === adjustmentId && item.factoryId === claims.factoryId)

    if (adjustment) {
      adjustment.status = 'confirmed'
      adjustment.items.forEach((item) => {
        const process = store.processes.find((entry) => entry.id === item.processId && entry.factoryId === claims.factoryId)
        if (process) {
          process.priceCents = item.newPriceCents
        }
      })
      createAuditLog(claims.factoryId, '工价', '管理员', '确认批量调价', `${adjustment.items.length} 道工序`)
    }

    return { ok: Boolean(adjustment), adjustment }
  })

  app.get('/api/teams', async (request) => {
    const claims = await requireAuth(request)
    return store.teams.filter((item) => item.factoryId === claims.factoryId)
  })

  app.post('/api/teams', async (request, reply) => {
    const claims = await requireAuth(request)
    const body = bodyOf<{ name: string; leader: string }>(request)
    const team = {
      id: id('team'),
      factoryId: claims.factoryId,
      name: stringValue(body.name, '新班组'),
      leader: stringValue(body.leader, '未设置'),
      memberCount: 0,
      status: 'active' as const
    }
    store.teams.unshift(team)
    createAuditLog(claims.factoryId, '员工', '管理员', '新增班组', team.name)
    return reply.code(201).send(team)
  })

  app.post('/api/invitations', async (request, reply) => {
    const claims = await requireAuth(request)
    const body = bodyOf<{ name: string; phone: string; role: Role }>(request)
    const application = {
      id: id('join'),
      factoryId: claims.factoryId,
      name: stringValue(body.name, '新成员'),
      phone: stringValue(body.phone),
      role: (body.role as Role) || 'employee',
      status: 'pending' as const,
      createdAt: now()
    }
    store.joinApplications.unshift(application)
    createAuditLog(claims.factoryId, '员工', '管理员', '发送成员邀请', application.name)
    return reply.code(201).send({ ok: true, inviteCode: requireFactory(claims).inviteCode, application })
  })

  app.get('/api/join-applications', async (request) => {
    const claims = await requireAuth(request)
    return store.joinApplications.filter((item) => item.factoryId === claims.factoryId)
  })

  app.post('/api/join-applications/:id/approve', async (request) => {
    const claims = await requireAuth(request)
    const { id: applicationId } = paramsOf<{ id: string }>(request)
    const application = store.joinApplications.find((item) => item.id === applicationId && item.factoryId === claims.factoryId)

    if (application) {
      application.status = 'approved'
      store.employees.unshift({
        id: id('emp'),
        factoryId: claims.factoryId,
        name: application.name,
        phone: application.phone,
        role: application.role,
        status: 'active'
      })
      createAuditLog(claims.factoryId, '员工', '管理员', '通过加入申请', application.name)
    }

    return { ok: Boolean(application), application }
  })

  app.post('/api/join-applications/:id/reject', async (request) => {
    const claims = await requireAuth(request)
    const { id: applicationId } = paramsOf<{ id: string }>(request)
    const application = store.joinApplications.find((item) => item.id === applicationId && item.factoryId === claims.factoryId)

    if (application) {
      application.status = 'rejected'
      createAuditLog(claims.factoryId, '员工', '管理员', '拒绝加入申请', application.name)
    }

    return { ok: Boolean(application), application }
  })

  app.post('/api/feedback', async (request, reply) => {
    const claims = await requireAuth(request)
    const body = bodyOf<{ content: string }>(request)
    const feedback = {
      id: id('feedback'),
      factoryId: claims.factoryId,
      userId: claims.userId,
      content: stringValue(body.content, '用户反馈'),
      status: 'submitted' as const,
      createdAt: now()
    }
    store.feedbacks.unshift(feedback)
    createMessage(claims.factoryId, '收到新的反馈', feedback.content, 'system')
    return reply.code(201).send(feedback)
  })

  app.get('/api/notification-preferences', async (request) => {
    const claims = await requireAuth(request)
    let preference = store.notificationPreferences.find((item) => item.factoryId === claims.factoryId && item.userId === claims.userId)

    if (!preference) {
      preference = { factoryId: claims.factoryId, userId: claims.userId, reportAudit: true, salary: true, subscription: true, system: true }
      store.notificationPreferences.push(preference)
    }

    return preference
  })

  app.patch('/api/notification-preferences', async (request) => {
    const claims = await requireAuth(request)
    const body = bodyOf<{ reportAudit: boolean; salary: boolean; subscription: boolean; system: boolean }>(request)
    let preference = store.notificationPreferences.find((item) => item.factoryId === claims.factoryId && item.userId === claims.userId)

    if (!preference) {
      preference = { factoryId: claims.factoryId, userId: claims.userId, reportAudit: true, salary: true, subscription: true, system: true }
      store.notificationPreferences.push(preference)
    }

    preference.reportAudit = typeof body.reportAudit === 'boolean' ? body.reportAudit : preference.reportAudit
    preference.salary = typeof body.salary === 'boolean' ? body.salary : preference.salary
    preference.subscription = typeof body.subscription === 'boolean' ? body.subscription : preference.subscription
    preference.system = typeof body.system === 'boolean' ? body.system : preference.system
    return preference
  })
}
