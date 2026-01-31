export const REQUEST_ATTACHMENT_TYPES = {
	BUSINESS_EVIDENCE: 'business_evidence',
	SESSION_ATTACHMENT: 'session_attachment',
	SESSION_ACTIVITY_ATTACHMENT: 'session_activity_attachment'
} as const

export type RequestAttachmentType = typeof REQUEST_ATTACHMENT_TYPES[keyof typeof REQUEST_ATTACHMENT_TYPES]
