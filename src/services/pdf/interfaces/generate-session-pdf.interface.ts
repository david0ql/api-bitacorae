export interface GenerateSessionPdfData {
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
	state: string
	sDate: string
}

interface Attachment {
	name: string;
	filePath: string;
}
