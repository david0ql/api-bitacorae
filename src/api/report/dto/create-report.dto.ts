import { ApiProperty } from "@nestjs/swagger"
import { IsIn, IsNotEmpty, IsNumber, IsString, ValidateIf } from "class-validator"

export class CreateReportDto {
	@ApiProperty({
		description: 'Name of the report',
		example: 'example'
	})
	@IsNotEmpty()
	@IsString()
	readonly name: string

	@ApiProperty({
		description: 'Document type ID',
		example: 1,
		enum: [1, 2, 3, 4]
	})
	@IsNotEmpty()
	@IsNumber()
	@IsIn([1, 2, 3, 4])
	readonly reportTypeId: number

	@ApiProperty({
		description: "Session ID",
		example: 1
	})
	@ValidateIf(o => [1].includes(o.reportTypeId))
	@IsNotEmpty()
	@IsNumber()
	readonly sessionId: number

	@ApiProperty({
		description: 'Business ID',
		example: 1
	})
	@ValidateIf(o => [2,3].includes(o.reportTypeId))
	@IsNotEmpty()
	@IsNumber()
	readonly businessId: number

	@ApiProperty({
		description: 'Expert ID',
		example: 1
	})
	@ValidateIf(o => [3,4].includes(o.reportTypeId))
	@IsNotEmpty()
	@IsNumber()
	readonly expertId: number
}
