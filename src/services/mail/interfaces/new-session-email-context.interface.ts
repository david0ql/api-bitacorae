export interface NewSessionEmailContext {
	to: string
	businessName: string
	expertName: string
	expertMail: string
	startDate: Date
	endDate: Date
	sessionDateFormat: string
	conferenceLink: string | undefined
	preparationNotes: string | undefined
}
