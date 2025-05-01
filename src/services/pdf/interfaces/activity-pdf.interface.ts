import { Attachment } from "./attachment-pdf.interface"

export interface Activity {
	title: string
	description: string
	requiresDeliverable: boolean
	dueDate: string
	attachment: Attachment | null

	respondedDate: string
	deliverableDescription: string
	deliverableAttachment: Attachment | null
	grade: number | string
}
