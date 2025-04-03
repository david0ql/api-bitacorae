import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateAccompanimentDto {
	@ApiProperty({ description: 'ID del negocio', example: 1 })
	@IsNotEmpty()
	@IsNumber()
	businessId: number;

	@ApiProperty({ description: 'ID del experto', example: 1 })
	@IsNotEmpty()
	@IsNumber()
	expertId: number;

	@ApiProperty({ description: 'Total de horas', example: 10 })
	@IsNotEmpty()
	@IsNumber()
	totalHours: number;

	@ApiProperty({ description: 'Máximo de horas por sesión', example: 2 })
	@IsNotEmpty()
	@IsNumber()
	maxHoursPerSession: number;

	@ApiProperty({ description: 'ID del área de fortalecimiento', example: 1 })
	@IsNotEmpty()
	@IsNumber()
	strengtheningAreaId: number;
}
