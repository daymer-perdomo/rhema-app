import CryptoJS from 'crypto-js'

export function encrypt(text, password) {
  return CryptoJS.AES.encrypt(text, password).toString()
}

export function decrypt(ciphertext, password) {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, password)
    const result = bytes.toString(CryptoJS.enc.Utf8)
    return result || null
  } catch {
    return null
  }
}

export function hashPassword(password) {
  return CryptoJS.SHA256(password).toString()
}
