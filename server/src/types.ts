export type Role = 'boss' | 'admin' | 'employee'
export type ReportStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'withdrawn'
export type PaymentStatus = 'pending' | 'paid' | 'closed' | 'refunded'

export interface User {
  id: string
  openid: string
  phone?: string
  nickname: string
  avatarUrl?: string
}

export interface Factory {
  id: string
  name: string
  ownerId: string
  inviteCode: string
}

export interface Member {
  id: string
  factoryId: string
  userId: string
  role: Role
  status: 'active' | 'disabled'
}

export interface Employee {
  id: string
  factoryId: string
  name: string
  phone?: string
  role: Role
  status: 'active' | 'disabled'
}

export interface ProcessItem {
  id: string
  factoryId: string
  name: string
  priceCents: number
  qrCode: string
  status: 'active' | 'disabled'
}

export interface Product {
  id: string
  factoryId: string
  name: string
  code?: string
  status: 'active' | 'disabled'
}

export interface ProcessRoute {
  id: string
  factoryId: string
  name: string
  qrCode: string
  status: 'active' | 'disabled'
  steps: Array<{ processId: string; sort: number }>
}

export interface ReportItem {
  processId: string
  processName: string
  priceCents: number
  quantity: number
  subtotalCents: number
}

export interface Report {
  id: string
  factoryId: string
  userId: string
  type: 'process' | 'route'
  status: ReportStatus
  remark?: string
  totalCents: number
  quantity: number
  items: ReportItem[]
  createdAt: string
  auditReason?: string
}

export interface Plan {
  id: string
  name: string
  monthlyCents: number
  yearlyCents: number
  employeeLimit: number
  features: string[]
}

export interface Subscription {
  id: string
  factoryId: string
  planId: string
  planName: string
  status: 'trial' | 'active' | 'expired'
  expireAt: string
  employeeLimit: number
}

export interface PaymentOrder {
  id: string
  factoryId: string
  planId: string
  planName: string
  amountCents: number
  status: PaymentStatus
  createdAt: string
}

export interface Bill {
  id: string
  factoryId: string
  title: string
  amountCents: number
  status: 'paid' | 'refund'
  invoiceStatus: 'none' | 'available' | 'applying' | 'issued'
  createdAt: string
}

export interface Announcement {
  id: string
  factoryId: string
  title: string
  content: string
  author: string
  createdAt: string
  status: 'published' | 'draft'
}

export interface Message {
  id: string
  factoryId: string
  userId?: string
  title: string
  content: string
  type: 'system' | 'audit' | 'salary' | 'subscription'
  read: boolean
  createdAt: string
}

export interface AuthClaims {
  userId: string
  factoryId: string
  role: Role
}

export interface SmsCode {
  phone: string
  code: string
  expiresAt: string
  nextSendAt: string
  verifyErrors: number
  lockedUntil?: string
  updatedAt: string
}

export interface SmsSendEvent {
  id: string
  phone: string
  ip: string
  createdAt: string
}
