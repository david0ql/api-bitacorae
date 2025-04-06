import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { StrengtheningArea } from 'src/entities/StrengtheningArea'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateStrengtheningAreaDto } from './dto/create-strengthening-area.dto'
import { UpdateStrengtheningAreaDto } from './dto/update-strengthening-area.dto'

@Injectable()
export class StrengtheningAreaService {
	constructor(
		@InjectRepository(StrengtheningArea)
		private readonly strengtheningAreaRepository: Repository<StrengtheningArea>
	) { }

	create(createStrengtheningAreaDto: CreateStrengtheningAreaDto) {
		const { name, level } = createStrengtheningAreaDto

		const strengtheningArea = this.strengtheningAreaRepository.create({ name, levelId: level })

		return this.strengtheningAreaRepository.save(strengtheningArea)
	}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<StrengtheningArea>> {
		const queryBuilder = this.strengtheningAreaRepository.createQueryBuilder('strengthening_area')
		.select([
			'strengthening_area.id',
			'strengthening_area.name',
			'strengthening_area.levelId',
		])
		.orderBy('strengthening_area.name', pageOptionsDto.order)
		.skip(pageOptionsDto.skip)
		.take(pageOptionsDto.take)

		const [ items, totalCount ] = await queryBuilder.getManyAndCount()

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}

	update(id: number, updateStrengtheningAreaDto: UpdateStrengtheningAreaDto) {
		if(!id) return { affected: 0 }

		const { name, level } = updateStrengtheningAreaDto

		const strengtheningArea = this.strengtheningAreaRepository.create({ name, levelId: level })

		return this.strengtheningAreaRepository.update(id, strengtheningArea)
	}

	remove(id: number) {
		if(!id) return { affected: 0 }

		return this.strengtheningAreaRepository.delete(id)
	}
}
