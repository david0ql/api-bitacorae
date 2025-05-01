export interface GenerateReportByExpertPdfData {
	eType: string
	eName: string
	eEmail: string
	ePhone: string
	eProfile: string
	eStrengtheningArea: string
	eEducationLevel: string
	eTotalHours: number | string
	eRegisteredHours: number | string
	accompaniments: Accompaniment[]
	generationDate: string
}

interface Accompaniment {
	aStrengtheningArea: string
	aTotalHours: number | string
	aRegisteredHours: number | string

	bSocialReason: string
	bPhone: string
	bEmail: string
	bEconomicActivity: string
	bBusinessSize: string
	bFacebook: string
	bInstagram: string
	bTwitter: string
	bWebsite: string
	sessions: Session[]
}

interface Session {
	stitle: string
	sPreparationNotes: string
	sPreparationFiles: Attachment[]
	sSessionNotes: string
	sConclusionsCommitments: string
	sAttachments: Attachment[]
	// sActivities: Activity[]
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
