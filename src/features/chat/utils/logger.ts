export const createLogger = (prefix: string) => {
  return (type: string, message: string, data?: unknown) => {
    const logPrefix = `[${prefix}:${type}]`
    if (data) {
      console.log(`${logPrefix} ${message}`, data)
    } else {
      console.log(`${logPrefix} ${message}`)
    }
  }
}
