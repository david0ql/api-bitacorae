import { ApiProperty } from "@nestjs/swagger"
import { IsString, MinLength } from "class-validator"

export class AuthDto {
    @ApiProperty({
        description: 'The email to use for login',
        example: 'user@gmail.com'
    })
    @IsString()
    @MinLength(4)
    email: string
    @ApiProperty({
        description: 'The password to use for login',
        example: 'user1234'
    })
    @IsString()
    @MinLength(4)
    password: string
}
