export interface NewSessionEmailContext {
	to: string
	bussinesName: string
	expertName: string
	sessionDateTime: string
	conferenceLink: string | undefined
	preparationNotes: string | undefined
}
