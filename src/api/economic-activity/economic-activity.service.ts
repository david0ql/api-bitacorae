import { Injectable } from '@nestjs/common'

import { EconomicActivity } from 'src/entities/EconomicActivity'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateEconomicActivityDto } from './dto/create-economic-activity.dto'
import { UpdateEconomicActivityDto } from './dto/update-economic-activity.dto'

@Injectable()
export class EconomicActivityService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService
	) {}

	async create(createEconomicActivityDto: CreateEconomicActivityDto, businessName: string) {
		const { name } = createEconomicActivityDto

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const economicRepository = businessDataSource.getRepository(EconomicActivity)
			const economicActivity = economicRepository.create({ name })
			return await economicRepository.save(economicActivity)
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async findAll(pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<EconomicActivity>> {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const economicRepository = businessDataSource.getRepository(EconomicActivity)
			
			const queryBuilder = economicRepository.createQueryBuilder('economic_activity')
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
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async update(id: number, updateEconomicActivityDto: UpdateEconomicActivityDto, businessName: string) {
		if(!id) return { affected: 0 }

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const economicRepository = businessDataSource.getRepository(EconomicActivity)
			const { name } = updateEconomicActivityDto
			return await economicRepository.update(id, { name })
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async remove(id: number, businessName: string) {
		if(!id) return { affected: 0 }

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const economicRepository = businessDataSource.getRepository(EconomicActivity)
			return await economicRepository.delete(id)
		} catch (e) {
			throw new Error(`No se pudo eliminar la actividad económica con id ${id}`)
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}
}
