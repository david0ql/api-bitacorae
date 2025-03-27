import { ApiProperty } from "@nestjs/swagger"
import { IsString, MinLength } from "class-validator"

export class AuthDto {
    @ApiProperty({
        description: 'The email to use for login',
        example: 'email'
    })
    @IsString()
    @MinLength(4)
    email: string
    @ApiProperty({
        description: 'The password to use for login',
        example: 'password'
    })
    @IsString()
    @MinLength(4)
    password: string
}
