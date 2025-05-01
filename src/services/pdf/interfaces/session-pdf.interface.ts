import { Activity } from "./activity-pdf.interface"
import { Attachment } from "./attachment-pdf.interface"

export interface Session {
	stitle: string
	sPreparationNotes: string
	sPreparationFiles: Attachment[]
	sSessionNotes: string
	sConclusionsCommitments: string
	sAttachments: Attachment[]
	sActivities: Activity[]
}
