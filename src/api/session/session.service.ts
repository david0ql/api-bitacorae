import { Repository } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { Accompaniment } from 'src/entities/Accompaniment'
import { Session } from 'src/entities/Session'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateSessiontDto } from './dto/create-session.dto'
import { UpdateSessionDto } from './dto/update-session.dto'

@Injectable()
export class SessionService {
	constructor(
		@InjectRepository(Session)
		private readonly sessionRepository: Repository<Session>,

		@InjectRepository(Accompaniment)
		private readonly accompanimentRepository: Repository<Accompaniment>
	) {}

	async create(createSessiontDto: CreateSessiontDto) {
		const {
			accompanimentId,
			title,
			startDatetime,
			endDatetime,
			conferenceLink,
			preparationNotes
		} = createSessiontDto

		const accompaniment = await this.accompanimentRepository.findOne({ where: { id: accompanimentId } })
		if (!accompaniment) {
			throw new BadRequestException(`Accompaniment with id ${accompanimentId} not found`)
		}

		const session = this.sessionRepository.create({
			accompaniment,
			title,
			startDatetime,
			endDatetime,
			conferenceLink,
			preparationNotes
		})

		return this.sessionRepository.save(session)
	}

	async findAll(id: number, pageOptionsDto: PageOptionsDto): Promise<PageDto<Session>> {
		const queryBuilder = this.sessionRepository.createQueryBuilder('session')
		.select([
			'session.id',
			'session.title',
			'session.startDatetime',
			'session.endDatetime',
			'TIMESTAMPDIFF(MINUTE, session.startDatetime, session.endDatetime) as duration',
			'status.name'
		])
		.innerJoin('session.status', 'status')
		.where('session.accompanimentId = :id', { id })
		.orderBy('session.startDatetime', pageOptionsDto.order)
		.skip(pageOptionsDto.skip)
		.take(pageOptionsDto.take)

		const [ items, totalCount ] = await queryBuilder.getManyAndCount()

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}

	async findOne(id: number) {
		if(!id) return {}

		const session = await this.sessionRepository.findOne({ where: { id } })

		return session || {}
	}

	async update(id: number, updateSessionDto: UpdateSessionDto) {
		if(!id) return { affected: 0 }

		const {
			title,
			startDatetime,
			endDatetime,
			conferenceLink,
			preparationNotes
		} = updateSessionDto

		return this.sessionRepository.update(id, {
			title,
			startDatetime,
			endDatetime,
			conferenceLink,
			preparationNotes
		})
	}

	async remove(id: number) {
		if(!id) return { affected: 0 }

		return this.sessionRepository.delete(id)
	}
}
