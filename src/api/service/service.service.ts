import { BadRequestException, Injectable } from '@nestjs/common'

import { Service } from 'src/entities/Service'
import { StrengtheningLevel } from 'src/entities/StrengtheningLevel'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateServiceDto } from './dto/create-service.dto'
import { UpdateServiceDto } from './dto/update-service.dto'

@Injectable()
export class ServiceService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService
	) { }

	async create(createServiceDto: CreateServiceDto, businessName: string) {
		const { name, level } = createServiceDto

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const serviceRepository = businessDataSource.getRepository(Service)
			const strengtheningLevelRepository = businessDataSource.getRepository(StrengtheningLevel)

			const strengtheningLevel = await strengtheningLevelRepository.findOne({ where: { id: level } })
			if (!strengtheningLevel) {
				throw new BadRequestException(`No se encontró el nivel de experticia con id ${level}`)
			}

			const service = serviceRepository.create({ name, levelId: level })
			return await serviceRepository.save(service)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async findAll(pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<Service>> {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const serviceRepository = businessDataSource.getRepository(Service)
			
			const queryBuilder = serviceRepository.createQueryBuilder('service')
				.select([
					'service.id AS id',
					'service.name AS name',
					'service.levelId AS levelId',
					'level.name AS levelName'
				])
				.leftJoin('service.level', 'level')
				.orderBy('service.name', pageOptionsDto.order)
				.skip(pageOptionsDto.skip)
				.take(pageOptionsDto.take)

			const [items, totalCount] = await Promise.all([
				queryBuilder.getRawMany(),
				queryBuilder.getCount()
			])

			const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })
			return new PageDto(items, pageMetaDto)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async update(id: number, updateServiceDto: UpdateServiceDto, businessName: string) {
		if(!id) return { affected: 0 }

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const serviceRepository = businessDataSource.getRepository(Service)
			const { name, level } = updateServiceDto
			return await serviceRepository.update(id, { name, levelId: level })
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async remove(id: number, businessName: string) {
		if(!id) return { affected: 0 }

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const serviceRepository = businessDataSource.getRepository(Service)
			return await serviceRepository.delete(id)
		} catch (e) {
			throw new BadRequestException(`No se puede eliminar el servicio con id ${id}`)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}
}
