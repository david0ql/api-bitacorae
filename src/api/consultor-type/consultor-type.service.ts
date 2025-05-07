import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { ConsultorType } from 'src/entities/ConsultorType'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateConsultorTypeDto } from './dto/create-consultor-type.dto'
import { UpdateConsultorTypeDto } from './dto/update-consultor-type.dto'

@Injectable()
export class ConsultorTypeService {
	constructor(
		@InjectRepository(ConsultorType)
		private readonly consultorRepository: Repository<ConsultorType>
	) {}

	create(createConsultorTypeDto: CreateConsultorTypeDto) {
		const { name, role } = createConsultorTypeDto

		const consultor = this.consultorRepository.create({ name, roleId: role })

		return this.consultorRepository.save(consultor)
	}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<ConsultorType>> {
		const queryBuilder = this.consultorRepository.createQueryBuilder('consultor_type')
		.select([
			'consultor_type.id AS id',
			'consultor_type.name AS name',
			'consultor_type.roleId AS roleId',
			'role.name AS roleName'
		])
		.leftJoin('consultor_type.role', 'role')
		.orderBy('consultor_type.name', pageOptionsDto.order)
		.skip(pageOptionsDto.skip)
		.take(pageOptionsDto.take)

		const [items, totalCount] = await Promise.all([
			queryBuilder.getRawMany(),
			queryBuilder.getCount()
		])

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })
		return new PageDto(items, pageMetaDto)
	}

	update(id: number, updateConsultorTypeDto: UpdateConsultorTypeDto) {
		if(!id) return { affected: 0 }

		const { name, role } = updateConsultorTypeDto

		return this.consultorRepository.update(id, { name, roleId: role })
	}

	remove(id: number) {
		if(!id) return { affected: 0 }

		try {
			return this.consultorRepository.delete(id)
		} catch (e) {
			throw new Error(`No se pudo eliminar el tipo de usuario con id ${id}`)
		}
	}
}
