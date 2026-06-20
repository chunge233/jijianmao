import { randomInt } from 'node:crypto'
import DysmsapiClient, { SendSmsRequest } from '@alicloud/dysmsapi20170525'
import { $OpenApiUtil } from '@alicloud/openapi-core'
import { id, now, store } from './store.js'

const phonePattern = /^1[3-9]\d{9}$/
const sendIntervalSeconds = Number(process.env.SMS_SEND_INTERVAL_SECONDS || 60)
const ipHourlyLimit = Number(process.env.SMS_IP_HOURLY_LIMIT || 10)
const ipDailyLimit = Number(process.env.SMS_IP_DAILY_LIMIT || 20)
const phoneDailyLimit = Number(process.env.SMS_PHONE_DAILY_LIMIT || 10)
const maxVerifyErrors = Number(process.env.SMS_MAX_VERIFY_ERRORS || 5)
const verifyLockSeconds = Number(process.env.SMS_VERIFY_LOCK_SECONDS || 30 * 60)

export function isValidPhone(phone: string) {
  return phonePattern.test(phone)
}

export function normalizePhone(phone: unknown) {
  return typeof phone === 'string' ? phone.trim() : ''
}

export function getClientIp(headers: Record<string, unknown>, remoteAddress?: string) {
  const headerKeys = [
    'x-forwarded-for',
    'x-real-ip',
    'proxy-client-ip',
    'wl-proxy-client-ip',
    'http_client_ip',
    'http_x_forwarded_for'
  ]

  for (const key of headerKeys) {
    const value = headers[key]
    if (typeof value === 'string' && value.trim() && value.toLowerCase() !== 'unknown') {
      return value.split(',')[0].trim()
    }
  }

  return remoteAddress || 'unknown'
}

export function getSmsCountdown(phone: string) {
  const code = store.smsCodes.find((item) => item.phone === phone)
  const nowMs = Date.now()
  const waitSeconds = code ? secondsLeft(code.nextSendAt, nowMs) : 0
  const codeExpireSeconds = code ? secondsLeft(code.expiresAt, nowMs) : 0

  return {
    waitSeconds,
    codeExpireSeconds,
    canSend: waitSeconds <= 0
  }
}

export async function sendVerificationCode(phone: string, clientIp: string) {
  pruneSmsState()

  const check = checkCanSend(phone, clientIp)
  if (!check.canSend) {
    return {
      success: false,
      message: check.message,
      waitSeconds: check.waitSeconds,
      expireSeconds: getCodeExpireSeconds()
    }
  }

  const code = generateCode(getCodeLength())
  const sent = await deliverSms(phone, code)
  if (!sent.success) {
    return {
      success: false,
      message: sent.message,
      waitSeconds: 0,
      expireSeconds: getCodeExpireSeconds()
    }
  }

  const nowMs = Date.now()
  const existing = store.smsCodes.find((item) => item.phone === phone)
  const nextCode = {
    phone,
    code,
    expiresAt: new Date(nowMs + getCodeExpireSeconds() * 1000).toISOString(),
    nextSendAt: new Date(nowMs + sendIntervalSeconds * 1000).toISOString(),
    verifyErrors: 0,
    updatedAt: now()
  }

  if (existing) {
    Object.assign(existing, nextCode)
    delete existing.lockedUntil
  } else {
    store.smsCodes.push(nextCode)
  }

  store.smsSendEvents.push({
    id: id('sms'),
    phone,
    ip: clientIp,
    createdAt: now()
  })

  return {
    success: true,
    message: '验证码发送成功',
    waitSeconds: sendIntervalSeconds,
    expireSeconds: getCodeExpireSeconds(),
    devCode: sent.devCode
  }
}

export function verifySmsCode(phone: string, code: string, options: { consume?: boolean } = {}) {
  pruneSmsState()

  const smsCode = store.smsCodes.find((item) => item.phone === phone)
  const nowMs = Date.now()

  if (!smsCode) {
    return { success: false, message: '验证码已过期，请重新获取' }
  }

  if (smsCode.lockedUntil && new Date(smsCode.lockedUntil).getTime() > nowMs) {
    return {
      success: false,
      message: `验证码错误次数过多，请${Math.ceil(secondsLeft(smsCode.lockedUntil, nowMs) / 60)}分钟后再试`,
      locked: true
    }
  }

  if (new Date(smsCode.expiresAt).getTime() <= nowMs) {
    store.smsCodes = store.smsCodes.filter((item) => item.phone !== phone)
    return { success: false, message: '验证码已过期，请重新获取' }
  }

  if (smsCode.code === code) {
    if (options.consume !== false) {
      store.smsCodes = store.smsCodes.filter((item) => item.phone !== phone)
    } else {
      smsCode.verifyErrors = 0
      delete smsCode.lockedUntil
    }

    return { success: true, message: '验证成功' }
  }

  smsCode.verifyErrors += 1
  smsCode.updatedAt = now()

  if (smsCode.verifyErrors >= maxVerifyErrors) {
    smsCode.lockedUntil = new Date(nowMs + verifyLockSeconds * 1000).toISOString()
    return {
      success: false,
      message: `验证码错误次数过多，请${Math.ceil(verifyLockSeconds / 60)}分钟后再试`,
      locked: true
    }
  }

  return {
    success: false,
    message: `验证码错误，还可尝试${Math.max(0, maxVerifyErrors - smsCode.verifyErrors)}次`
  }
}

function checkCanSend(phone: string, clientIp: string) {
  const countdown = getSmsCountdown(phone)
  if (countdown.waitSeconds > 0) {
    return {
      canSend: false,
      waitSeconds: countdown.waitSeconds,
      message: `发送过于频繁，请${countdown.waitSeconds}秒后重试`
    }
  }

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000
  const hourAgo = Date.now() - 60 * 60 * 1000
  const phoneDailyCount = store.smsSendEvents.filter((item) => item.phone === phone && new Date(item.createdAt).getTime() > dayAgo).length
  const ipDailyCount = store.smsSendEvents.filter((item) => item.ip === clientIp && new Date(item.createdAt).getTime() > dayAgo).length
  const ipHourlyCount = store.smsSendEvents.filter((item) => item.ip === clientIp && new Date(item.createdAt).getTime() > hourAgo).length

  if (phoneDailyCount >= phoneDailyLimit) {
    return { canSend: false, waitSeconds: -1, message: '该手机号今日发送次数已达上限，请明天再试' }
  }

  if (ipHourlyCount >= ipHourlyLimit) {
    return { canSend: false, waitSeconds: -1, message: '操作过于频繁，请稍后再试' }
  }

  if (ipDailyCount >= ipDailyLimit) {
    return { canSend: false, waitSeconds: -1, message: '今日请求次数已达上限，请明天再试' }
  }

  return { canSend: true, waitSeconds: 0, message: '' }
}

async function deliverSms(phone: string, code: string) {
  const accessKeyId = process.env.ALIYUN_SMS_ACCESS_KEY_ID || process.env.ALIBABA_CLOUD_ACCESS_KEY_ID
  const accessKeySecret = process.env.ALIYUN_SMS_ACCESS_KEY_SECRET || process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET
  const signName = process.env.ALIYUN_SMS_SIGN_NAME
  const templateCode = process.env.ALIYUN_SMS_TEMPLATE_CODE
  const hasAliyunConfig = Boolean(accessKeyId && accessKeySecret && signName && templateCode)
  const devMode = process.env.SMS_DEV_MODE === 'true' || (process.env.NODE_ENV !== 'production' && !hasAliyunConfig)

  if (devMode) {
    return { success: true, message: '开发模式验证码已生成', devCode: code }
  }

  if (!hasAliyunConfig) {
    return { success: false, message: '短信服务未配置，请检查阿里云短信环境变量' }
  }

  try {
    const config = new $OpenApiUtil.Config({
      accessKeyId,
      accessKeySecret
    })
    config.endpoint = 'dysmsapi.aliyuncs.com'

    const SmsClient = ((DysmsapiClient as unknown as { default?: unknown }).default || DysmsapiClient) as new (config: $OpenApiUtil.Config) => {
      sendSms: (request: SendSmsRequest) => Promise<{ body?: { code?: string; message?: string } }>
    }
    const client = new SmsClient(config)
    const request = new SendSmsRequest({
      phoneNumbers: phone,
      signName,
      templateCode,
      templateParam: JSON.stringify({ code })
    })
    const response = await client.sendSms(request)
    const body = response.body || {}

    if (body.code === 'OK') {
      return { success: true, message: '验证码发送成功' }
    }

    return { success: false, message: body.message || '验证码发送失败，请稍后重试' }
  } catch (error) {
    const message = error instanceof Error ? error.message : '验证码发送失败，请稍后重试'
    return { success: false, message }
  }
}

function generateCode(length: number) {
  let code = ''
  for (let index = 0; index < length; index += 1) {
    code += String(randomInt(0, 10))
  }
  return code
}

function getCodeLength() {
  const length = Number(process.env.SMS_CODE_LENGTH || 6)
  return Math.min(6, Math.max(4, length))
}

function getCodeExpireSeconds() {
  return Number(process.env.SMS_CODE_EXPIRE_SECONDS || 300)
}

function secondsLeft(iso: string, fromMs: number) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - fromMs) / 1000))
}

function pruneSmsState() {
  const nowMs = Date.now()
  const dayAgo = nowMs - 24 * 60 * 60 * 1000
  store.smsCodes = store.smsCodes.filter((item) => {
    const expiresAt = new Date(item.expiresAt).getTime()
    const lockedUntil = item.lockedUntil ? new Date(item.lockedUntil).getTime() : 0
    return expiresAt > nowMs || lockedUntil > nowMs
  })
  store.smsSendEvents = store.smsSendEvents.filter((item) => new Date(item.createdAt).getTime() > dayAgo)
}
