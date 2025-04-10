import { Repository } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { Accompaniment } from 'src/entities/Accompaniment'
import { Business } from 'src/entities/Business'
import { Expert } from 'src/entities/Expert'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateAccompanimentDto } from './dto/create-accompaniment.dto'
import { UpdateAccompanimentDto } from './dto/update-accompaniment.dto'

@Injectable()
export class AccompanimentService {
	constructor(
		@InjectRepository(Accompaniment)
		private readonly accompanimentRepository: Repository<Accompaniment>,

		@InjectRepository(Business)
		private readonly businessRepository: Repository<Business>,

		@InjectRepository(Expert)
		private readonly expertRepository: Repository<Expert>,

		@InjectRepository(StrengtheningArea)
		private readonly strengtheningAreaRepository: Repository<StrengtheningArea>
	) {}

	async create(createAccompanimentDto: CreateAccompanimentDto) {
		const {
			businessId,
			expertId,
			totalHours,
			maxHoursPerSession,
			strengtheningAreaId
		} = createAccompanimentDto

		const business = await this.businessRepository.findOne({ where: { id: businessId } })
		if (!business) {
			throw new BadRequestException(`Business with id ${businessId} not found`)
		}

		const expert = await this.expertRepository.findOne({ where: { id: expertId } })
		if (!expert) {
			throw new BadRequestException(`Expert with id ${expertId} not found`)
		}

		const strengtheningArea = await this.strengtheningAreaRepository.findOne({ where: { id: strengtheningAreaId } })
		if (!strengtheningArea) {
			throw new BadRequestException(`Strengthening area with id ${strengtheningAreaId} not found`)
		}

		const existingAccompaniment = await this.accompanimentRepository.findOne({
			where: { businessId, expertId }
		})

		if (existingAccompaniment) {
			throw new BadRequestException(`Business with id ${businessId} is already accompanied by expert with id ${expertId}`)
		}

		const accompaniment = this.accompanimentRepository.create({
			businessId,
			expertId,
			totalHours,
			maxHoursPerSession,
			strengtheningAreaId
		})

		return this.accompanimentRepository.save(accompaniment)
	}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<Accompaniment>> {
		const queryBuilder = this.businessRepository.createQueryBuilder('business')
			.select([
				'business.id AS id',
				'business.socialReason AS socialReason',
				'business.documentTypeId AS documentTypeId',
				'business.documentNumber AS documentNumber',
				'business.created_at AS createdAt',
				'user.active AS userActive',
				"CONCAT(contact.first_name, ' ', contact.last_name, ' - ', business.email) AS userInfo",
				"IFNULL(ROUND((SUM(CASE WHEN session.status_id = 3 THEN TIMESTAMPDIFF(HOUR, session.start_datetime, session.end_datetime) ELSE 0 END) / business.assigned_hours) * 100, 2), 0) AS progress"
			])
			.innerJoin('business.user', 'user')
			.leftJoin('business.contactInformations', 'contact')
			.leftJoin('business.accompaniments', 'accompaniment')
			.leftJoin('accompaniment.sessions', 'session')
			.groupBy('business.id')
			.orderBy('business.id', pageOptionsDto.order)
			.skip(pageOptionsDto.skip)
			.take(pageOptionsDto.take)

		const [ items, totalCount ] = await Promise.all([
			queryBuilder.getRawMany(),
			queryBuilder.getCount()
		])

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}

	async findOne(id: number) {
		if(!id) return {}

		const accompaniment = await this.accompanimentRepository.findOne({ where: { id } })

		return accompaniment || {}
	}

	async update(id: number, updateAccompanimentDto: UpdateAccompanimentDto) {
		if(!id) return { affected: 0 }

		const {
			businessId,
			expertId,
			totalHours,
			maxHoursPerSession,
			strengtheningAreaId
		} = updateAccompanimentDto

		if(businessId) {
			const business = await this.businessRepository.findOne({ where: { id: businessId } })
			if (!business) {
				throw new BadRequestException(`Business with id ${businessId} not found`)
			}
		}

		if(expertId) {
			const expert = await this.expertRepository.findOne({ where: { id: expertId } })
			if (!expert) {
				throw new BadRequestException(`Expert with id ${expertId} not found`)
			}
		}

		if(strengtheningAreaId) {
			const strengtheningArea = await this.strengtheningAreaRepository.findOne({ where: { id: strengtheningAreaId } })
			if (!strengtheningArea) {
				throw new BadRequestException(`Strengthening area with id ${strengtheningAreaId} not found`)
			}
		}

		if(businessId && expertId) {
			const existingAccompaniment = await this.accompanimentRepository.findOne({
				where: { businessId, expertId }
			})
			if (existingAccompaniment && existingAccompaniment.id !== id) {
				throw new BadRequestException(`Business with id ${businessId} is already accompanied by expert with id ${expertId}`)
			}
		}

		return this.accompanimentRepository.update(id, {
			businessId,
			expertId,
			totalHours,
			maxHoursPerSession,
			strengtheningAreaId
		})
	}

	async remove(id: number) {
		if(!id) return { affected: 0 }

		return this.accompanimentRepository.delete(id)
	}
}
