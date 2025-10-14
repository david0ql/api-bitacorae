import { BadRequestException, Injectable } from '@nestjs/common'

import { Cohort } from 'src/entities/Cohort'
import { DateService } from 'src/services/date/date.service'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateCohortDto } from './dto/create-cohort.dto'
import { UpdateCohortDto } from './dto/update-cohort.dto'

@Injectable()
export class CohortService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService,
		private readonly dateService: DateService
	) {}

	async create(createCohortDto: CreateCohortDto, businessName: string) {
		const { name, order, startDate, endDate } = createCohortDto

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const cohortRepository = businessDataSource.getRepository(Cohort)

			const startDateVal = this.dateService.parseToDate(startDate)
			const endDateVal = this.dateService.parseToDate(endDate)

			const diffInHours = this.dateService.getHoursDiff(startDateVal, endDateVal)
			const now = this.dateService.getNow()

			if (diffInHours <= 0) {
				throw new BadRequestException('La fecha de inicio debe ser menor a la fecha de fin')
			}

			if (endDateVal < now) {
				throw new BadRequestException('La fecha fin debe ser posterior a la actual')
			}

			const cohort = cohortRepository.create({ name, order, startDate, endDate })

			return await cohortRepository.save(cohort)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async findAll(pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<Cohort>> {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const cohortRepository = businessDataSource.getRepository(Cohort)
			
			const queryBuilder = cohortRepository.createQueryBuilder('cohort')
				.select([
					'cohort.id',
					'cohort.name',
					'cohort.order',
					'cohort.startDate',
					'cohort.endDate'
				])
				.orderBy('cohort.order', pageOptionsDto.order)
				.addOrderBy('cohort.name', pageOptionsDto.order)
				.skip(pageOptionsDto.skip)
				.take(pageOptionsDto.take)

			const [ items, totalCount ] = await queryBuilder.getManyAndCount()

			const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

			return new PageDto(items, pageMetaDto)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async update(id: number, updateCohortDto: UpdateCohortDto, businessName: string) {
		if(!id) return { affected: 0 }

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const cohortRepository = businessDataSource.getRepository(Cohort)
			const { name, order, startDate, endDate } = updateCohortDto

			if(startDate && endDate) {
				const startDateVal = this.dateService.parseToDate(startDate)
				const endDateVal = this.dateService.parseToDate(endDate)

				const diffInHours = this.dateService.getHoursDiff(startDateVal, endDateVal)
				const now = this.dateService.getNow()

				if (diffInHours <= 0) {
					throw new BadRequestException('La fecha de inicio debe ser menor a la fecha de fin')
				}

				if (endDateVal < now) {
					throw new BadRequestException('La fecha fin debe ser posterior a la actual')
				}
			}

			return await cohortRepository.update(id, { name, order, startDate, endDate })
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async remove(id: number, businessName: string) {
		if(!id) return { affected: 0 }

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const cohortRepository = businessDataSource.getRepository(Cohort)
			return await cohortRepository.delete(id)
		} catch (e) {
			throw new Error(`No se pudo eliminar el cohort con id ${id}`)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}
}
