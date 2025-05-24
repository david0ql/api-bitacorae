export interface NewSessionEmailContext {
	to: string
	businessName: string
	expertName: string
	expertMail: string
	sessionDateTime: string
	conferenceLink: string | undefined
	preparationNotes: string | undefined
}
