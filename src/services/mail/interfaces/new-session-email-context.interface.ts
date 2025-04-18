export interface NewSessionEmailContext {
	to: string
	bussinesName: string
	expertName: string
	sessionDate: string
	sessionTime: string
	preparationNotes: string | undefined
}
