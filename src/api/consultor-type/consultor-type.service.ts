import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'

import { ConsultorType } from 'src/entities/ConsultorType'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateConsultorTypeDto } from './dto/create-consultor-type.dto'
import { UpdateConsultorTypeDto } from './dto/update-consultor-type.dto'

@Injectable()
export class ConsultorTypeService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService
	) {}

	async create(createConsultorTypeDto: CreateConsultorTypeDto, businessName: string) {
		const { name, role } = createConsultorTypeDto

		if (!businessName) {
			throw new Error('Se requiere especificar una empresa para crear el tipo de consultor')
		}

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		
		if (!businessDataSource) {
			throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		}

		try {
			const consultorRepository = businessDataSource.getRepository(ConsultorType)
			const consultor = consultorRepository.create({ name, roleId: role })
			return await consultorRepository.save(consultor)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async findAll(pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<ConsultorType>> {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		
		if (!businessDataSource) {
			throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		}

		try {
			const consultorRepository = businessDataSource.getRepository(ConsultorType)
			
			const queryBuilder = consultorRepository.createQueryBuilder('consultor_type')
				.select([
					'consultor_type.id AS id',
					'consultor_type.name AS name',
					'consultor_type.roleId AS roleId',
					'role.name AS roleName'
				])
				.leftJoin('consultor_type.role', 'role')
				.orderBy('consultor_type.name', pageOptionsDto.order)
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

	async update(id: number, updateConsultorTypeDto: UpdateConsultorTypeDto, businessName: string) {
		if(!id) return { affected: 0 }

		if (!businessName) {
			throw new Error('Se requiere especificar una empresa para actualizar el tipo de consultor')
		}

		const { name, role } = updateConsultorTypeDto

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		
		if (!businessDataSource) {
			throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		}

		try {
			const consultorRepository = businessDataSource.getRepository(ConsultorType)
			return await consultorRepository.update(id, { name, roleId: role })
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async remove(id: number, businessName: string) {
		if(!id) return { affected: 0 }

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		
		if (!businessDataSource) {
			throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		}

		try {
			const consultorRepository = businessDataSource.getRepository(ConsultorType)
			return await consultorRepository.delete(id)
		} catch (e) {
			throw new Error(`No se pudo eliminar el tipo de usuario con id ${id}`)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}
}
