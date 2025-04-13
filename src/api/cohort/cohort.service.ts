import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { Cohort } from 'src/entities/Cohort'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateCohortDto } from './dto/create-cohort.dto'
import { UpdateCohortDto } from './dto/update-cohort.dto'

@Injectable()
export class CohortService {
	constructor(
		@InjectRepository(Cohort)
		private readonly cohortRepository: Repository<Cohort>
	) {}

	create(createCohortDto: CreateCohortDto) {
		const { name, order, startDate, endDate } = createCohortDto

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
			.orderBy('cohort.name', pageOptionsDto.order)
			.skip(pageOptionsDto.skip)
			.take(pageOptionsDto.take)

		const [ items, totalCount ] = await queryBuilder.getManyAndCount()

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}

	update(id: number, updateCohortDto: UpdateCohortDto) {
		if(!id) return { affected: 0 }

		const { name, order, startDate, endDate } = updateCohortDto

		return this.cohortRepository.update(id, { name, order, startDate, endDate })
	}

	remove(id: number) {
		if(!id) return { affected: 0 }

		return this.cohortRepository.delete(id)
	}
}
