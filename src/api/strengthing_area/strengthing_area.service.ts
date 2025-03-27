import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { StrengthingAreaEntity } from 'src/entities/strengthing_area.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateStrengthingAreaDto } from './dto/create-strengthing-area.dto'
import { UpdateStrengthingAreaDto } from './dto/update-strengthing-area.dto'

@Injectable()
export class StrengthingAreaService {
	constructor(
		@InjectRepository(StrengthingAreaEntity)
		private readonly strengthingAreaRepository: Repository<StrengthingAreaEntity>
	) { }

	create(createStrengthingAreaDto: CreateStrengthingAreaDto) {
		const { name, level } = createStrengthingAreaDto

		const strengthingArea = this.strengthingAreaRepository.create({ name, levelId: level })

		return this.strengthingAreaRepository.save(strengthingArea)
	}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<StrengthingAreaEntity>> {
		const queryBuilder = this.strengthingAreaRepository.createQueryBuilder('strengthing_area')
		.select([
			'strengthing_area.id',
			'strengthing_area.name',
			'strengthing_area.levelId',
		])
		.orderBy('strengthing_area.created_at')
		.skip(pageOptionsDto.skip)
		.take(pageOptionsDto.take)

		const [ items, totalCount ] = await queryBuilder.getManyAndCount()

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}

	update(id: number, updateStrengthingAreaDto: UpdateStrengthingAreaDto) {
		const { name, level } = updateStrengthingAreaDto

		const strengthingArea = this.strengthingAreaRepository.create({ name, levelId: level })

		return this.strengthingAreaRepository.update(id, strengthingArea)
	}

	remove(id: number) {
		return this.strengthingAreaRepository.delete(id)
	}
}
