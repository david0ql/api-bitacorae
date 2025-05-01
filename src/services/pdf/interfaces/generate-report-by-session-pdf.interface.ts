import { Activity } from "./activity-pdf.interface"
import { Attachment } from "./attachment-pdf.interface"

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
	sActivities: Activity[]

	generationDate: string
}
