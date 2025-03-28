import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'

import { UserEntity } from 'src/entities/user.entity'
import { BusinessEntity } from 'src/entities/business.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateBusinessDto } from './dto/create-business.dto'
import { UpdateBusinessDto } from './dto/update-business.dto'

@Injectable()
export class BusinessService {
	constructor(
		@InjectRepository(BusinessEntity)
		private readonly businessRepository: Repository<BusinessEntity>,

		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>
	) {}

	async create(createBusinessDto: CreateBusinessDto) {
		const {
			socialReason,
			documentTypeId,
			documentNumber,
			address,
			phone,
			email,
			economicActivityId,
			businessSizeId,
			numberOfEmployees,
			lastYearSales,
			twoYearsAgoSales,
			threeYearsAgoSales,
			facebook,
			instagram,
			twitter,
			website,
			linkedin,
			positionId,
			hasFoundedBefore,
			observation,
			numberOfPeopleLeading,
			productStatusId,
			marketScopeId,
			businessPlan,
			businessSegmentation,
			strengthingAreaId,
			assignedHours,
			cohortId,
			diagnostic,
			evidence,
			password
		} = createBusinessDto

		const salt = bcrypt.genSaltSync(10)
		const hash = bcrypt.hashSync(password, salt)

		const user = this.userRepository.create({
			roleId: 4,
			name: socialReason,
			email,
			password: hash
		})

		const newUser = await this.userRepository.save(user)

		const business = this.businessRepository.create({
			userId: newUser.id,
			socialReason,
			documentTypeId,
			documentNumber,
			address,
			phone,
			email,
			economicActivityId,
			businessSizeId,
			numberOfEmployees,
			lastYearSales,
			twoYearsAgoSales,
			threeYearsAgoSales,
			facebook,
			instagram,
			twitter,
			website,
			linkedin,
			positionId,
			hasFoundedBefore,
			observation,
			numberOfPeopleLeading,
			productStatusId,
			marketScopeId,
			businessPlan,
			businessSegmentation,
			strengthingAreaId,
			assignedHours,
			cohortId,
			diagnostic,
			evidence
		})

		return this.businessRepository.save(business)
	}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<BusinessEntity>> {
		const queryBuilder = this.businessRepository.createQueryBuilder('business')
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

		const business = await this.businessRepository.findOne({ where: { id } })

		return business || {}
	}

	async update(id: number, updateBusinessDto: UpdateBusinessDto) {
		if(!id) return { affected: 0 }

		const {
			active,
			socialReason,
			documentTypeId,
			documentNumber,
			address,
			phone,
			email,
			economicActivityId,
			businessSizeId,
			numberOfEmployees,
			lastYearSales,
			twoYearsAgoSales,
			threeYearsAgoSales,
			facebook,
			instagram,
			twitter,
			website,
			linkedin,
			positionId,
			hasFoundedBefore,
			observation,
			numberOfPeopleLeading,
			productStatusId,
			marketScopeId,
			businessPlan,
			businessSegmentation,
			strengthingAreaId,
			assignedHours,
			cohortId,
			diagnostic,
			evidence
		} = updateBusinessDto

		const business = this.businessRepository.create({
			socialReason,
			documentTypeId,
			documentNumber,
			address,
			phone,
			email,
			economicActivityId,
			businessSizeId,
			numberOfEmployees,
			lastYearSales,
			twoYearsAgoSales,
			threeYearsAgoSales,
			facebook,
			instagram,
			twitter,
			website,
			linkedin,
			positionId,
			hasFoundedBefore,
			observation,
			numberOfPeopleLeading,
			productStatusId,
			marketScopeId,
			businessPlan,
			businessSegmentation,
			strengthingAreaId,
			assignedHours,
			cohortId,
			diagnostic,
			evidence
		})

		const result = this.businessRepository.update(id, business)

		const businessData = await this.businessRepository.findOne({
			select: { userId: true },
			where: { id }
		})

		if(businessData) {
			const user = this.userRepository.create({
				active,
				name: socialReason,
				email
			})

			await this.userRepository.update(businessData.userId, user)
		}

		return { result }
	}

	async remove(id: number) {
		if(!id) return { affected: 0 }

		const business = await this.businessRepository.findOne({
			select: { userId: true },
			where: { id }
		})

		const result = await this.businessRepository.delete(id)

		if(business) {
			await this.userRepository.delete(business.userId)
		}

		return result
	}
}
