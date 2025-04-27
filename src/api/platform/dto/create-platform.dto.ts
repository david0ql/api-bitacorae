import { ApiProperty } from "@nestjs/swagger"
import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator"

export class CreatePlatformDto {
    @ApiProperty({
        description: 'Nombre del operador',
        example: 'Operador XYZ',
		required: true
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    readonly operatorName: string

    @ApiProperty({
		type: 'string',
		format: 'binary',
		required: false
    })
    readonly logoFile?: string

    @ApiProperty({
        type: 'string',
		format: 'binary',
		required: false
    })
    readonly reportHeaderImageFile?: string

    @ApiProperty({
        description: 'Sitio web',
        example: 'https://www.example.com',
        required: false
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    readonly website?: string

    @ApiProperty({
        description: 'Nombre del programa',
        example: 'Programa ABC',
        required: false
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    readonly programName?: string

    @ApiProperty({
        description: 'Correo electrónico de notificaciones',
        example: 'notificaciones@example.com',
        required: false
    })
    @IsOptional()
    @IsEmail()
    @MaxLength(255)
    readonly notificationEmail?: string

    @ApiProperty({
        description: 'Fecha de inicio del programa',
        example: '2025-04-01',
        required: false
    })
    @IsOptional()
    @IsDateString()
    readonly programStartDate?: string
}
