import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { Gender } from 'src/entities/Gender'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Injectable()
export class GenderService {
	constructor(
		@InjectRepository(Gender)
		private readonly genderRepository: Repository<Gender>
	) {}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<Gender>> {
		const queryBuilder = this.genderRepository.createQueryBuilder('gender')
		.select([
			'gender.id',
			'gender.name'
		])
		.orderBy('gender.id', pageOptionsDto.order)
		.skip(pageOptionsDto.skip)
		.take(pageOptionsDto.take)

		const [ items, totalCount ] = await queryBuilder.getManyAndCount()

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}
}
