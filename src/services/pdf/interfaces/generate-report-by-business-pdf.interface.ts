import { Session } from "./session-pdf.interface"

export interface GenerateReportByBusinessPdfData {
	bSocialReason: string
	bPhone: string
	bEmail: string
	bEconomicActivity: string
	bBusinessSize: string
	bFacebook: string
	bInstagram: string
	bTwitter: string
	bWebsite: string
	accompaniments: Accompaniment[]
	generationDate: string
}

interface Accompaniment {
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
	eTotalHours: number | string
	sessions: Session[]
}
