export interface NewSessionEmailContext {
	to: string
	businessName: string
	expertName: string
	sessionDateTime: string
	conferenceLink: string | undefined
	preparationNotes: string | undefined
}
