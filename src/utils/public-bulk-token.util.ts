import { BadRequestException } from '@nestjs/common'
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import envVars from 'src/config/env'

const TOKEN_SCOPE = 'public_bulk_catalogs'
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000
const TOKEN_ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

export type PublicBulkTokenType = 'expert' | 'business'

type PublicBulkTokenPayload = {
	scope: typeof TOKEN_SCOPE
	type: PublicBulkTokenType
	businessName: string
	exp: number
}

export type PublicBulkTokenInfo = {
	businessName: string
	exp: number
}

const getEncryptionKey = () => createHash('sha256').update(envVars.JWT_SECRET).digest()

const toBase64Url = (value: Buffer) => value.toString('base64url')
const fromBase64Url = (value: string) => Buffer.from(value, 'base64url')

export const createPublicBulkToken = (businessName: string, type: PublicBulkTokenType): string => {
	if (!businessName || typeof businessName !== 'string') {
		throw new BadRequestException('No se pudo generar el enlace público')
	}

	const payload: PublicBulkTokenPayload = {
		scope: TOKEN_SCOPE,
		type,
		businessName: businessName.trim(),
		exp: Date.now() + TOKEN_TTL_MS
	}

	const iv = randomBytes(IV_LENGTH)
	const cipher = createCipheriv(TOKEN_ALGORITHM, getEncryptionKey(), iv)

	const encrypted = Buffer.concat([
		cipher.update(JSON.stringify(payload), 'utf8'),
		cipher.final()
	])
	const authTag = cipher.getAuthTag()

	return `${toBase64Url(iv)}.${toBase64Url(encrypted)}.${toBase64Url(authTag)}`
}

const getPublicBulkTokenPayload = (
	token: string,
	expectedType: PublicBulkTokenType
): PublicBulkTokenPayload => {
	const invalidTokenError = new BadRequestException('El enlace público no es válido o ya expiró')

	if (!token || typeof token !== 'string') {
		throw invalidTokenError
	}

	const parts = token.split('.')
	if (parts.length !== 3 || parts.some((part) => !part)) {
		throw invalidTokenError
	}

	try {
		const [ivToken, encryptedToken, authTagToken] = parts
		const iv = fromBase64Url(ivToken)
		const encrypted = fromBase64Url(encryptedToken)
		const authTag = fromBase64Url(authTagToken)

		const decipher = createDecipheriv(TOKEN_ALGORITHM, getEncryptionKey(), iv)
		decipher.setAuthTag(authTag)

		const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
		const payload = JSON.parse(decrypted) as PublicBulkTokenPayload

		if (
			payload?.scope !== TOKEN_SCOPE ||
			payload?.type !== expectedType ||
			typeof payload?.businessName !== 'string' ||
			!payload.businessName.trim() ||
			typeof payload?.exp !== 'number' ||
			payload.exp < Date.now()
		) {
			throw invalidTokenError
		}

		return payload
	} catch {
		throw invalidTokenError
	}
}

export const getPublicBulkTokenInfo = (
	token: string,
	expectedType: PublicBulkTokenType
): PublicBulkTokenInfo => {
	const payload = getPublicBulkTokenPayload(token, expectedType)
	return {
		businessName: payload.businessName.trim(),
		exp: payload.exp
	}
}

export const getBusinessNameFromPublicBulkToken = (
	token: string,
	expectedType: PublicBulkTokenType
): string => {
	return getPublicBulkTokenInfo(token, expectedType).businessName
}
