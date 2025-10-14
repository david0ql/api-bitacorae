export interface ApprovedSessionEmailContext {
	to: string
	businessName: string
	expertName: string
	expertMail: string
	sessionDateTime: string
	isApproved: boolean
	signature: string
	rejectedDate?: string
}
