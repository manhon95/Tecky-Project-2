import { Request } from 'express'

export function getString(req: Request, field: string) {
  return checkString(field, req.body[field])
}

export function checkString(field: string, value: unknown) {
  if (value === undefined) {
    throw new HttpError(400, 'Missing ' + field)
  }
  if (typeof value !== 'string') {
    throw new HttpError(400, 'Invalid ' + field + ', should a string')
  }
  if (value.length === 0) {
    throw new HttpError(400, 'Invalid ' + field + ', should not be empty')
  }
  return value
}

export class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
  }
}
