import { Repository } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { AccompanimentEntity } from 'src/entities/accompaniment.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateAccompanimentDto } from './dto/create-accompaniment.dto'
import { UpdateAccompanimentDto } from './dto/update-accompaniment.dto'
import { BusinessEntity } from 'src/entities/business.entity'
import { ExpertEntity } from 'src/entities/expert.entity'
import { StrengtheningAreaEntity } from 'src/entities/strengthening_area.entity'

@Injectable()
export class AccompanimentService {
	constructor(
		@InjectRepository(AccompanimentEntity)
		private readonly accompanimentRepository: Repository<AccompanimentEntity>,

		@InjectRepository(BusinessEntity)
		private readonly businessRepository: Repository<BusinessEntity>,

		@InjectRepository(ExpertEntity)
		private readonly expertRepository: Repository<ExpertEntity>,

		@InjectRepository(StrengtheningAreaEntity)
		private readonly strengtheningAreaRepository: Repository<StrengtheningAreaEntity>
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

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<AccompanimentEntity>> {
		const queryBuilder = this.accompanimentRepository.createQueryBuilder('business')
		.select([
			'business.id AS id',
			'business.socialReason AS socialReason',
			'business.documentTypeId AS documentTypeId',
			'business.documentNumber AS documentNumber',
			'business.created_at AS createdAt',
			'user.active AS userActive',
			"CONCAT(contact.first_name, ' ', contact.last_name, ' - ', business.email) AS userInfo",
			"'100%' AS progress"
		])
		.innerJoin('business.user', 'user')
		.leftJoin('business.contactInformations', 'contact')
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

		const accoAccompaniment = await this.accompanimentRepository.findOne({ where: { id } })

		return accoAccompaniment || {}
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

		const accompaniment = this.accompanimentRepository.create({
			businessId,
			expertId,
			totalHours,
			maxHoursPerSession,
			strengtheningAreaId
		})

		return this.accompanimentRepository.update(id, accompaniment)
	}

	async remove(id: number) {
		if(!id) return { affected: 0 }

		return this.accompanimentRepository.delete(id)
	}
}
