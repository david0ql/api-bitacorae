import { Repository } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'

import { User } from 'src/entities/User'
import { Business } from 'src/entities/Business'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateBusinessDto } from './dto/create-business.dto'
import { UpdateBusinessDto } from './dto/update-business.dto'

@Injectable()
export class BusinessService {
	constructor(
		@InjectRepository(Business)
		private readonly businessRepository: Repository<Business>,

		@InjectRepository(User)
		private readonly userRepository: Repository<User>
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
			strengtheningAreaId,
			assignedHours,
			cohortId,
			diagnostic,
			evidence,
			password
		} = createBusinessDto

		const existingUser = await this.userRepository.findOne({ where: { email } })
		if(existingUser) throw new BadRequestException('Email already exists')

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
			strengtheningAreaId,
			assignedHours,
			cohortId,
			diagnostic,
			evidence
		})

		return this.businessRepository.save(business)
	}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<Business>> {
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
			strengtheningAreaId,
			assignedHours,
			cohortId,
			diagnostic,
			evidence
		} = updateBusinessDto

		const existingUser = await this.userRepository.findOne({ where: { email } })
		if(existingUser && existingUser.id != id) {
			throw new BadRequestException('Email already exists')
		}

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
			strengtheningAreaId,
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
