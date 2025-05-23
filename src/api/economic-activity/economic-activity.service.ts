import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { EconomicActivity } from 'src/entities/EconomicActivity'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateEconomicActivityDto } from './dto/create-economic-activity.dto'
import { UpdateEconomicActivityDto } from './dto/update-economic-activity.dto'

@Injectable()
export class EconomicActivityService {
	constructor(
		@InjectRepository(EconomicActivity)
		private readonly economicRepository: Repository<EconomicActivity>
	) {}

	create(createEconomicActivityDto: CreateEconomicActivityDto) {
		const { name } = createEconomicActivityDto

		const economicActivity = this.economicRepository.create({ name })

		return this.economicRepository.save(economicActivity)
	}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<EconomicActivity>> {
		const queryBuilder = this.economicRepository.createQueryBuilder('economic_activity')
		.select([
			'economic_activity.id',
			'economic_activity.name'
		])
		.orderBy('economic_activity.name', pageOptionsDto.order)
		.skip(pageOptionsDto.skip)
		.take(pageOptionsDto.take)

		const [ items, totalCount ] = await queryBuilder.getManyAndCount()

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}

	update(id: number, updateEconomicActivityDto: UpdateEconomicActivityDto) {
		if(!id) return { affected: 0 }

		const { name } = updateEconomicActivityDto

		return this.economicRepository.update(id, { name })
	}

	remove(id: number) {
		if(!id) return { affected: 0 }

		try {
			return this.economicRepository.delete(id)
		} catch (e) {
			throw new Error(`No se pudo eliminar la actividad económica con id ${id}`)
		}
	}
}
