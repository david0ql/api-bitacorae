export interface GenerateReportBySessionPdfData {
	bSocialReason: string
	bPhone: string
	bEmail: string
	bEconomicActivity: string
	bBusinessSize: string
	bFacebook: string
	bInstagram: string
	bTwitter: string
	bWebsite: string
	aStrengtheningArea: string
	aTotalHours: number | string
	aRegisteredHours: number | string
	eType: string
	eName: string
	eEmail: string
	ePhone: string
	eProfile: string
	eStrengtheningArea: string
	eEducationLevel: string
	stitle: string
	sPreparationNotes: string
	sPreparationFiles: Attachment[]
	sSessionNotes: string
	sConclusionsCommitments: string
	sAttachments: Attachment[]
	// sActivities: Activity[]

	generationDate: string
}

interface Attachment {
	name: string
	filePath: string
}

// interface Activity {
// 	title: string
// 	description: string
// 	requiresDeliverable: boolean
// 	attachment: Attachment | null
// 	grade: number | null
// }
