import { Repository } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { Cohort } from 'src/entities/Cohort'
import { DateService } from 'src/services/date/date.service'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateCohortDto } from './dto/create-cohort.dto'
import { UpdateCohortDto } from './dto/update-cohort.dto'

@Injectable()
export class CohortService {
	constructor(
		@InjectRepository(Cohort)
		private readonly cohortRepository: Repository<Cohort>,

		private readonly dateService: DateService
	) {}

	create(createCohortDto: CreateCohortDto) {
		const { name, order, startDate, endDate } = createCohortDto

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

		const cohort = this.cohortRepository.create({ name, order, startDate, endDate })

		return this.cohortRepository.save(cohort)
	}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<Cohort>> {
		const queryBuilder = this.cohortRepository.createQueryBuilder('cohort')
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
	}

	update(id: number, updateCohortDto: UpdateCohortDto) {
		if(!id) return { affected: 0 }

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

		return this.cohortRepository.update(id, { name, order, startDate, endDate })
	}

	remove(id: number) {
		if(!id) return { affected: 0 }

		try {
			return this.cohortRepository.delete(id)
		} catch (e) {
			throw new Error(`No se pudo eliminar el cohort con id ${id}`)
		}
	}
}
