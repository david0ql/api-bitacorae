import { PartialType } from '@nestjs/swagger'
import { CreateSessionAttachmentDto } from './create-session_attachment.dto'

export class UpdateSessionAttachmentDto extends PartialType(CreateSessionAttachmentDto) {}
