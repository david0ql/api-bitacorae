import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EducationLevel } from 'src/entities/EducationLevel'
import { Repository } from 'typeorm'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'

@Injectable()
export class EducationLevelService {
  	constructor(
		@InjectRepository(EducationLevel)
		private readonly educationLevelRepository: Repository<EducationLevel>
	) {}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<EducationLevel>> {
		const queryBuilder = this.educationLevelRepository.createQueryBuilder('education_level')
		.select([
			'education_level.id',
			'education_level.name'
		])
		.orderBy('education_level.name', pageOptionsDto.order)
		.skip(pageOptionsDto.skip)
		.take(pageOptionsDto.take)

		const [ items, totalCount ] = await queryBuilder.getManyAndCount()

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}
}
