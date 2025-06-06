import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsNumber, IsString } from "class-validator"

export class ChangePasswordByAdminDto {
	@ApiProperty({
		description: 'ID of the entity',
		example: 1
	})
	@IsNotEmpty()
	@IsNumber()
	readonly id: number

	@ApiProperty({
		description: 'Role of the user',
		example: 1
	})
	@IsNotEmpty()
	@IsNumber()
	readonly role: number

	@ApiProperty({
		description: 'New password',
		example: 'new_password'
	})
	@IsNotEmpty()
	@IsString()
	readonly newPassword: string

	@ApiProperty({
		description: 'Confirm new password',
		example: 'new_password'
	})
	@IsNotEmpty()
	@IsString()
	readonly confirmNewPassword: string
}
