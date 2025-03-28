import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { CohortEntity } from 'src/entities/cohort.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateCohortDto } from './dto/create-cohort.dto'
import { UpdateCohortDto } from './dto/update-cohort.dto'

@Injectable()
export class CohortService {
	constructor(
		@InjectRepository(CohortEntity)
		private readonly cohortRepository: Repository<CohortEntity>
	) {}

	create(createCohortDto: CreateCohortDto) {
		const { name, order, startDate, endDate } = createCohortDto

		const cohort = this.cohortRepository.create({ name, order, startDate, endDate })

		return this.cohortRepository.save(cohort)
	}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<CohortEntity>> {
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

		const cohort = this.cohortRepository.create({ name, order, startDate, endDate })

		return this.cohortRepository.update(id, cohort)
	}

	remove(id: number) {
		if(!id) return { affected: 0 }

		return this.cohortRepository.delete(id)
	}
}
