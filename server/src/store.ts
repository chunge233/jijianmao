import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import type {
  Announcement,
  Bill,
  Employee,
  Factory,
  Member,
  Message,
  PaymentOrder,
  Plan,
  ProcessItem,
  ProcessRoute,
  Product,
  Report,
  SmsCode,
  SmsSendEvent,
  Subscription,
  User
} from './types.js'

const now = () => new Date().toISOString()
const moduleDir = dirname(fileURLToPath(import.meta.url))
const storeFilePath = process.env.STORE_FILE
  ? resolve(process.env.STORE_FILE)
  : resolve(moduleDir, '../data/store.json')
const databaseStoreId = 'default'
const databaseUrl = process.env.DATABASE_URL || ''
const useDatabaseStore = /^postgres(?:ql)?:\/\//.test(databaseUrl) && process.env.STORE_DRIVER !== 'file'
let saveQueue = Promise.resolve()
let prisma: PrismaClient | undefined

const userId = 'user_demo'
const factoryId = 'factory_demo'

const processes: ProcessItem[] = [
  { id: 'quality', factoryId, name: '产品质检', priceCents: 35, qrCode: 'PJ-QC-001', status: 'active' },
  { id: 'assembly', factoryId, name: '零件装配', priceCents: 30, qrCode: 'PJ-AS-002', status: 'active' },
  { id: 'drill', factoryId, name: '钻孔', priceCents: 50, qrCode: 'PJ-DR-003', status: 'active' },
  { id: 'cutting', factoryId, name: '切割', priceCents: 40, qrCode: 'PJ-CT-004', status: 'active' },
  { id: 'package', factoryId, name: '包装检验', priceCents: 20, qrCode: 'PJ-PK-005', status: 'active' }
]

export const store = {
  users: [
    { id: userId, openid: 'mock-openid', phone: '13500000000', nickname: '王工' }
  ] as User[],
  factories: [
    { id: factoryId, name: '兴华五金厂', ownerId: userId, inviteCode: 'JJM-6288' }
  ] as Factory[],
  members: [
    { id: 'member_demo', factoryId, userId, role: 'boss', status: 'active' }
  ] as Member[],
  employees: [
    { id: 'emp_1', factoryId, name: '王工', phone: '13500000000', role: 'employee', status: 'active' },
    { id: 'emp_2', factoryId, name: '张伟', phone: '13600000000', role: 'admin', status: 'active' }
  ] as Employee[],
  processes,
  products: [
    { id: 'product_1', factoryId, name: '春季工装外套', code: 'P-2026-001', status: 'active' },
    { id: 'product_2', factoryId, name: '五金零件套装', code: 'P-2026-002', status: 'active' }
  ] as Product[],
  routes: [
    {
      id: 'parts-route',
      factoryId,
      name: '零件加工路线',
      qrCode: 'RT-PARTS-001',
      status: 'active',
      steps: [
        { processId: 'cutting', sort: 1 },
        { processId: 'drill', sort: 2 },
        { processId: 'assembly', sort: 3 },
        { processId: 'quality', sort: 4 }
      ]
    },
    {
      id: 'assembly-route',
      factoryId,
      name: '成品组装路线',
      qrCode: 'RT-FINAL-002',
      status: 'active',
      steps: [
        { processId: 'assembly', sort: 1 },
        { processId: 'quality', sort: 2 },
        { processId: 'package', sort: 3 }
      ]
    }
  ] as ProcessRoute[],
  reports: [
    {
      id: 'report_1',
      factoryId,
      userId,
      type: 'process',
      status: 'approved',
      remark: '产品表面无明显划痕，包装完好。',
      totalCents: 1050,
      quantity: 30,
      items: [
        { processId: 'quality', processName: '产品质检', priceCents: 35, quantity: 30, subtotalCents: 1050 }
      ],
      createdAt: '2026-06-17T14:30:00.000Z'
    },
    {
      id: 'report_2',
      factoryId,
      userId,
      type: 'route',
      status: 'pending',
      remark: '零件加工路线按顺序完成，请审核。',
      totalCents: 6000,
      quantity: 150,
      items: [
        { processId: 'cutting', processName: '切割', priceCents: 40, quantity: 50, subtotalCents: 2000 },
        { processId: 'drill', processName: '钻孔', priceCents: 50, quantity: 50, subtotalCents: 2500 },
        { processId: 'assembly', processName: '零件装配', priceCents: 30, quantity: 50, subtotalCents: 1500 }
      ],
      createdAt: '2026-06-17T10:15:00.000Z'
    },
    {
      id: 'report_3',
      factoryId,
      userId,
      type: 'process',
      status: 'rejected',
      remark: '数量需要复核。',
      totalCents: 2400,
      quantity: 60,
      items: [
        { processId: 'cutting', processName: '切割', priceCents: 40, quantity: 60, subtotalCents: 2400 }
      ],
      createdAt: '2026-06-16T09:20:00.000Z',
      auditReason: '数量与现场记录不一致，请核实后重新提交。'
    }
  ] as Report[],
  plans: [
    { id: 'basic', name: '基础版', monthlyCents: 9900, yearlyCents: 99000, employeeLimit: 20, features: ['单工序报工', '基础工资统计'] },
    { id: 'pro', name: '专业版', monthlyCents: 12900, yearlyCents: 93000, employeeLimit: 100, features: ['扫码报工', '工艺路线', '工资确认', '权限角色'] }
  ] as Plan[],
  subscriptions: [
    { id: 'sub_demo', factoryId, planId: 'pro', planName: '专业版试用', status: 'trial', expireAt: '2026-06-30T00:00:00.000Z', employeeLimit: 100 }
  ] as Subscription[],
  salaryConfirmations: [] as Array<{ factoryId: string; userId: string; month: string; status: 'confirmed' | 'disputed'; reason?: string }>,
  teams: [
    { id: 'team_1', factoryId, name: '生产一组', leader: '张伟', memberCount: 8, status: 'active' },
    { id: 'team_2', factoryId, name: '质检组', leader: '王工', memberCount: 3, status: 'active' }
  ] as Array<{ id: string; factoryId: string; name: string; leader: string; memberCount: number; status: 'active' | 'disabled' }>,
  joinApplications: [
    { id: 'join_1', factoryId, name: '周玲', phone: '13200006780', role: 'employee' as const, status: 'pending' as const, createdAt: now() }
  ] as Array<{ id: string; factoryId: string; name: string; phone?: string; role: 'boss' | 'admin' | 'employee'; status: 'pending' | 'approved' | 'rejected'; createdAt: string }>,
  backups: [
    { id: 'backup_1', factoryId, date: '今天 23:00', size: '18.2MB', status: '自动备份', createdAt: now() }
  ] as Array<{ id: string; factoryId: string; date: string; size: string; status: string; createdAt: string }>,
  exportJobs: [
    { id: 'export_1', factoryId, name: '2026年6月工资报表.xlsx', scope: '全厂 · 21人 · 356条', status: 'ready', createdAt: now() }
  ] as Array<{ id: string; factoryId: string; name: string; scope: string; status: 'pending' | 'ready'; createdAt: string }>,
  priceAdjustments: [] as Array<{ id: string; factoryId: string; items: Array<{ processId: string; oldPriceCents: number; newPriceCents: number }>; status: 'pending' | 'confirmed'; createdAt: string }>,
  feedbacks: [] as Array<{ id: string; factoryId: string; userId: string; content: string; status: 'submitted' | 'closed'; createdAt: string }>,
  notificationPreferences: [] as Array<{ factoryId: string; userId: string; reportAudit: boolean; salary: boolean; subscription: boolean; system: boolean }>,
  employeeImports: [] as Array<{
    id: string
    factoryId: string
    total: number
    valid: number
    duplicate: number
    invalid: number
    rows: Array<{ name: string; phone: string; role: 'boss' | 'admin' | 'employee' }>
    status: 'preview' | 'imported'
    createdAt: string
  }>,
  reportDrafts: [
    {
      id: 'draft_1',
      factoryId,
      userId,
      type: 'process' as const,
      items: [{ processId: 'quality', processName: '产品质检', priceCents: 35, quantity: 20, subtotalCents: 700 }],
      remark: '草稿报工',
      createdAt: '2026-06-18T13:40:00.000Z'
    }
  ] as Array<{ id: string; factoryId: string; userId: string; type: 'process' | 'route'; items: Array<{ processId: string; processName: string; priceCents: number; quantity: number; subtotalCents: number }>; remark?: string; createdAt: string }>,
  auditLogs: [
    { id: 'log_1', factoryId, category: '数据', user: '系统', action: '自动备份完成', detail: '备份大小 18.2MB', createdAt: now() }
  ] as Array<{ id: string; factoryId: string; category: string; user: string; action: string; detail: string; createdAt: string }>,
  paymentOrders: [] as PaymentOrder[],
  bills: [
    { id: 'bill_1', factoryId, title: '专业版年付', amountCents: 93000, status: 'paid', invoiceStatus: 'available', createdAt: '2026-06-18T15:20:00.000Z' }
  ] as Bill[],
  messages: [
    { id: 'msg_1', factoryId, title: '报工已通过', content: '产品质检 30件 已通过审核。', type: 'audit', read: false, createdAt: now() },
    { id: 'msg_2', factoryId, title: '套餐试用提醒', content: '专业版试用将于 2026-06-30 到期，可在套餐订阅中升级。', type: 'subscription', read: false, createdAt: '2026-06-18T12:00:00.000Z' }
  ] as Message[],
  smsCodes: [] as SmsCode[],
  smsSendEvents: [] as SmsSendEvent[],
  announcements: [
    {
      id: 'ann_1',
      factoryId,
      title: '6月生产计划已发布',
      content: '根据公司生产计划安排，6月份生产任务已正式发布。本月重点产品为 A-200 系列零部件，请各线组长做好人员调配，确保产能达标。',
      author: '张主管',
      createdAt: '2026-06-15T09:30:00.000Z',
      status: 'published'
    },
    {
      id: 'ann_2',
      factoryId,
      title: '6月工价调整公告',
      content: '部分工序单价已按最新工艺路线调整，请报工前确认工序二维码和路线二维码是否为最新版。',
      author: '生产部',
      createdAt: '2026-06-10T10:00:00.000Z',
      status: 'published'
    }
  ] as Announcement[]
}

export type StoreState = typeof store

export async function loadStore() {
  if (useDatabaseStore) {
    await loadStoreFromDatabase()
    return
  }

  await loadStoreFromFile()
}

async function loadStoreFromFile() {
  try {
    const raw = await readFile(storeFilePath, 'utf8')
    return applyPersistedStore(JSON.parse(raw))
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code

    if (code !== 'ENOENT') {
      throw error
    }

    return false
  }
}

export async function saveStore() {
  saveQueue = saveQueue.catch(() => undefined).then(async () => {
    if (useDatabaseStore) {
      await saveStoreToDatabase()
      return
    }

    await saveStoreToFile()
  })

  return saveQueue
}

async function loadStoreFromDatabase() {
  const state = await getPrisma().appState.findUnique({
    where: { id: databaseStoreId }
  })

  if (state && applyPersistedStore(state.data)) {
    return
  }

  await loadStoreFromFile()
  await saveStore()
}

async function saveStoreToDatabase() {
  const data = JSON.parse(JSON.stringify(store)) as Prisma.InputJsonValue

  await getPrisma().appState.upsert({
    where: { id: databaseStoreId },
    create: {
      id: databaseStoreId,
      data
    },
    update: {
      data
    }
  })
}

async function saveStoreToFile() {
  await mkdir(dirname(storeFilePath), { recursive: true })
  const temporaryPath = `${storeFilePath}.${process.pid}.${Date.now()}.${randomUUID().slice(0, 8)}.tmp`
  await writeFile(temporaryPath, `${JSON.stringify(store, null, 2)}\n`, 'utf8')
  await replaceStoreFile(temporaryPath)
}

function applyPersistedStore(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  Object.assign(store, value as Partial<StoreState>)
  return true
}

function getPrisma() {
  prisma ||= new PrismaClient()
  return prisma
}

async function replaceStoreFile(temporaryPath: string) {
  let replaced = false

  try {
    await rename(temporaryPath, storeFilePath)
    replaced = true
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code

    if (code !== 'EPERM' && code !== 'EEXIST') {
      throw error
    }

    await rm(storeFilePath, { force: true })
    await rename(temporaryPath, storeFilePath)
    replaced = true
  } finally {
    if (!replaced) {
      await rm(temporaryPath, { force: true }).catch(() => undefined)
    }
  }
}

export async function flushStore() {
  await saveQueue
}

export function id(prefix: string) {
  return `${prefix}_${randomUUID().slice(0, 8)}`
}

export function currentFactoryForUser(userIdValue: string) {
  const member = store.members.find((item) => item.userId === userIdValue && item.status === 'active')
  return member ? store.factories.find((factory) => factory.id === member.factoryId) : undefined
}

export function getRouteSteps(route: ProcessRoute) {
  return route.steps
    .slice()
    .sort((a, b) => a.sort - b.sort)
    .map((step) => store.processes.find((process) => process.id === step.processId))
    .filter((item): item is ProcessItem => Boolean(item))
}

export function createMessage(factoryIdValue: string, title: string, content: string, type: Message['type']) {
  store.messages.unshift({
    id: id('msg'),
    factoryId: factoryIdValue,
    title,
    content,
    type,
    read: false,
    createdAt: now()
  })
}

export function createAuditLog(factoryIdValue: string, category: string, user: string, action: string, detail: string) {
  store.auditLogs.unshift({
    id: id('log'),
    factoryId: factoryIdValue,
    category,
    user,
    action,
    detail,
    createdAt: now()
  })
}

export { now }
