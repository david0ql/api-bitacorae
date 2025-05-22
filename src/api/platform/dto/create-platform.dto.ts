import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsBoolean, IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator"

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
    readonly logoFile?: any

	@ApiProperty({
		description: 'Eliminar logo',
		example: true,
		required: false
	})
	@Type(() => Boolean)
	@IsBoolean()
	@IsOptional()
	readonly deleteLogo?: boolean

    @ApiProperty({
        type: 'string',
		format: 'binary',
		required: false
    })
    readonly reportHeaderImageFile?: any

	@ApiProperty({
		description: 'Eliminar imagen de encabezado del informe',
		example: true,
		required: false
	})
	@Type(() => Boolean)
	@IsBoolean()
	@IsOptional()
	readonly deleteReportHeaderImage?: boolean

    @ApiProperty({
        description: 'Sitio web',
        example: 'https://www.example.com',
        required: true
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    readonly website?: string

    @ApiProperty({
        description: 'Nombre del programa',
        example: 'Programa ABC',
        required: true
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(500)
    readonly programName?: string

    @ApiProperty({
        description: 'Correo electrónico de notificaciones',
        example: 'notificaciones@example.com',
        required: true
    })
    @IsNotEmpty()
    @IsEmail()
    @MaxLength(255)
    readonly notificationEmail?: string

    @ApiProperty({
        description: 'Fecha de inicio del programa',
        example: '2025-04-01',
        required: true
    })
    @IsNotEmpty()
    @IsDateString()
    readonly programStartDate?: string
}
