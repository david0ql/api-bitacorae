import { Attachment } from "./attachment-pdf.interface"

export interface SessionActivityResponse {
	message: string
	attachmentPath: string | null
	createdAt: string
}

export interface SessionActivity {
	title: string
	description: string
	requiresDeliverable: string
	dueDatetime: string
	attachmentPath: string | null
	responses: SessionActivityResponse[]
}

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
	sSessionActivities: SessionActivity[]

	sign: boolean
	state: string
	generationDate: string
	signature?: string
	signedDate?: string
}
