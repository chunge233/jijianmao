import { networkInterfaces } from 'node:os'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

function isPrivateLan(ip) {
  return /^192\.168\./.test(ip) || /^10\./.test(ip) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
}

const addresses = Object.values(networkInterfaces())
  .flat()
  .filter(Boolean)
  .filter((item) => item.family === 'IPv4' && !item.internal && isPrivateLan(item.address))
  .map((item) => item.address)

const lanIp = addresses.find((ip) => ip.startsWith('192.168.')) || addresses[0]

if (!lanIp) {
  throw new Error('未找到可用局域网 IPv4 地址')
}

const content = `module.exports = {
  DEV_API_BASE_URL: 'http://127.0.0.1:3000',
  LAN_API_BASE_URL: 'http://${lanIp}:3000'
}
`

await writeFile(resolve('miniprogram/env.js'), content, 'utf8')
console.log(`LAN_API_BASE_URL=http://${lanIp}:3000`)
