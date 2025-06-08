import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber } from "class-validator";

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

	@ApiProperty({
		description: 'Áreas de fortalecimiento (IDs)',
		example: [1, 2]
	})
	@Transform(({ value }) => {
		try {
			if (typeof value === 'string') return value.split(',').map(Number);
			return value;
		} catch {
			return [];
		}
	})
	@IsArray()
	@ArrayNotEmpty()
	@IsNumber({}, { each: true })
	readonly strengtheningAreas: number[];
}
