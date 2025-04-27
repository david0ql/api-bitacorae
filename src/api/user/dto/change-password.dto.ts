import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString } from "class-validator"

export class ChangePasswordDto {
	@ApiProperty({
		description: 'Current password',
		example: 'current_password'
	})
	@IsNotEmpty()
	@IsString()
	readonly currentPassword: string

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
