import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'

import { Session } from 'src/entities/Session'
import { SessionActivity } from 'src/entities/SessionActivity'
import { SessionActivityResponse } from 'src/entities/SessionActivityResponse'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateSessionActivityDto } from './dto/create-session_activity.dto'
import { RespondSessionActivityDto } from './dto/respond-session_activity.dto'
import { RateSessionActivityDto } from './dto/rate-session_activity.dto'
import { JwtUser } from '../auth/interfaces/jwt-user.interface'

@Injectable()
export class SessionActivityService {
	constructor(
		@InjectRepository(SessionActivity)
		private readonly sessionActivityRepository: Repository<SessionActivity>,

		@InjectRepository(SessionActivityResponse)
		private readonly sessionActivityResponseRepository: Repository<SessionActivityResponse>,

		@InjectRepository(Session)
		private readonly sessionRepository: Repository<Session>
	) {}

	async create(user: JwtUser, createSessionActivityDto: CreateSessionActivityDto) {
		const { title, description, dueDatetime, requiresDeliverable, sessionId } = createSessionActivityDto
		const { id } = user

		const session = await this.sessionRepository.findOne({ where: { id: sessionId } })
		if (!session) {
			throw new BadRequestException(`Session with id ${sessionId} not found`)
		}

		const sessionActivity = this.sessionActivityRepository.create({
			sessionId,
			createdByUserId: id,
			title,
			description,
			requiresDeliverable,
			dueDatetime
		})

		return this.sessionActivityRepository.save(sessionActivity)
	}

	async findAll(sessionId: number, pageOptionsDto: PageOptionsDto): Promise<PageDto<SessionActivity>> {
		const queryBuilder = this.sessionActivityRepository.createQueryBuilder('activity')
			.leftJoinAndSelect('activity.sessionActivityResponses', 'response')
			.where('activity.sessionId = :sessionId', { sessionId })
			.orderBy('activity.createdAt', pageOptionsDto.order)
			.skip(pageOptionsDto.skip)
			.take(pageOptionsDto.take)

		const [items, totalCount] = await queryBuilder.getManyAndCount()

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })
		return new PageDto(items, pageMetaDto)
	}

	async respond(user: JwtUser, id: number, respondSessionActivityDto: RespondSessionActivityDto) {
		if(!id) return { affected: 0 }

		const { deliverableDescription } = respondSessionActivityDto
		const { id: userId } = user

		const sessionActivity = await this.sessionActivityRepository.findOne({ where: { id } })
		if (!sessionActivity) {
			throw new BadRequestException(`Session activity with id ${id} not found`)
		}

		const existingResponse = await this.sessionActivityResponseRepository.findOne({ where: { sessionActivityId: id } })
		if (existingResponse) {
			throw new BadRequestException(`Session activity with id ${id} already responded`)
		}

		const sessionActivityResponse = this.sessionActivityResponseRepository.create({
			sessionActivityId: id,
			respondedByUserId: userId,
			deliverableDescription
		})

		return this.sessionActivityResponseRepository.save(sessionActivityResponse)
	}

	async rate(id: number, rateSessionActivityDto: RateSessionActivityDto) {
		if(!id) return { affected: 0 }

		const { grade } = rateSessionActivityDto

		const sessionActivityResponse = await this.sessionActivityResponseRepository.findOne({ where: { sessionActivityId: id } })
		if (!sessionActivityResponse) {
			throw new BadRequestException(`Session activity response with id ${id} not found`)
		}

		return this.sessionActivityResponseRepository.update(id, {
			grade,
			gradedDatetime: new Date()
		})
	}
}
