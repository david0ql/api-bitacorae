import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'

import { UserEntity } from 'src/entities/user.entity'
import { ExpertEntity } from 'src/entities/expert.entity'
import { ConsultorTypeEntity } from 'src/entities/consultor_type.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateExpertDto } from './dto/create-expert.dto'
import { UpdateExpertDto } from './dto/update-expert.dto'

@Injectable()
export class ExpertService {
	constructor(
		@InjectRepository(ExpertEntity)
		private readonly expertRepository: Repository<ExpertEntity>,

		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,

		@InjectRepository(ConsultorTypeEntity)
		private readonly consultorTypeRepository: Repository<ConsultorTypeEntity>
	) {}

	async create(createExpertDto: CreateExpertDto) {
		const {
			firstName,
			lastName,
			email,
			phone,
			documentTypeId,
			documentNumber,
			photo,
			consultorTypeId,
			genderId,
			experienceYears,
			strengthingAreaId,
			educationLevelId,
			facebook,
			instagram,
			twitter,
			website,
			linkedin,
			profile,
			password
		} = createExpertDto

		const consultorType = await this.consultorTypeRepository.findOne({
			select: { roleId: true },
			where: { id: consultorTypeId }
		})

		const salt = bcrypt.genSaltSync(10)
		const hash = bcrypt.hashSync(password, salt)

		const user = this.userRepository.create({
			roleId: consultorType?.roleId,
			name: firstName,
			email,
			password: hash
		})

		const newUser = await this.userRepository.save(user)

		const expert = this.expertRepository.create({
			userId: newUser.id,
			firstName,
			lastName,
			email,
			phone,
			documentTypeId,
			documentNumber,
			photo,
			consultorTypeId,
			genderId,
			experienceYears,
			strengthingAreaId,
			educationLevelId,
			facebook,
			instagram,
			twitter,
			website,
			linkedin,
			profile
		})

		return this.expertRepository.save(expert)
	}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<ExpertEntity>> {
		const queryBuilder = this.expertRepository.createQueryBuilder('expert')
		.select([
			'expert.id',
			'expert.userId',
			'expert.firstName',
			'expert.lastName',
			'expert.email',
			'expert.phone',
			'expert.documentTypeId',
			'expert.documentNumber',
			'expert.photo',
			'expert.consultorTypeId',
			'expert.genderId',
			'expert.experienceYears',
			'expert.strengthingAreaId',
			'expert.educationLevelId',
			'expert.facebook',
			'expert.instagram',
			'expert.twitter',
			'expert.website',
			'expert.linkedin',
			'expert.profile'
		])
		.addSelect('user.active')
		.innerJoin('expert.user', 'user')
		.orderBy('expert.id', pageOptionsDto.order)
		.skip(pageOptionsDto.skip)
		.take(pageOptionsDto.take)

		const [ items, totalCount ] = await queryBuilder.getManyAndCount()

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}

	async update(id: number, updateExpertDto: UpdateExpertDto) {
		if(!id) return { affected: 0 }

		const {
			active,
			firstName,
			lastName,
			email,
			phone,
			documentTypeId,
			documentNumber,
			photo,
			consultorTypeId,
			genderId,
			experienceYears,
			strengthingAreaId,
			educationLevelId,
			facebook,
			instagram,
			twitter,
			website,
			linkedin,
			profile
		} = updateExpertDto

		const consultorType = await this.consultorTypeRepository.findOne({
			select: { roleId: true },
			where: { id: consultorTypeId }
		})

		const expert = this.expertRepository.create({
			firstName,
			lastName,
			email,
			phone,
			documentTypeId,
			documentNumber,
			photo,
			consultorTypeId,
			genderId,
			experienceYears,
			strengthingAreaId,
			educationLevelId,
			facebook,
			instagram,
			twitter,
			website,
			linkedin,
			profile
		})

		const result = await this.expertRepository.update(id, expert)

		const expertData = await this.expertRepository.findOne({
			select: { userId: true },
			where: { id }
		})

		if(expertData) {
			const user = this.userRepository.create({
				roleId: consultorType?.roleId,
				active,
				name: firstName,
				email
			})

			await this.userRepository.update(expertData.userId, user)
		}

		return result
	}

	async remove(id: number) {
		if(!id) return { affected: 0 }

		const expertData = await this.expertRepository.findOne({
			select: { userId: true },
			where: { id }
		})

		const result = await this.expertRepository.delete(id)

		if(expertData) {
			await this.userRepository.delete(expertData.userId)
		}

		return result
	}
}
