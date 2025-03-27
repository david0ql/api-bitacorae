import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { ConsultorTypeEntity } from 'src/entities/consultor_type.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateConsultorTypeDto } from './dto/create-consultor-type.dto'
import { UpdateConsultorTypeDto } from './dto/update-consultor-type.dto'

@Injectable()
export class ConsultorTypeService {
	constructor(
		@InjectRepository(ConsultorTypeEntity)
		private readonly consultorRepository: Repository<ConsultorTypeEntity>
	) {}

	create(createConsultorTypeDto: CreateConsultorTypeDto) {
		const { name, role } = createConsultorTypeDto

		const consultor = this.consultorRepository.create({ name, roleId: role })

		return this.consultorRepository.save(consultor)
	}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<ConsultorTypeEntity>> {
		const queryBuilder = this.consultorRepository.createQueryBuilder('consultor_type')
		.select([
			'consultor_type.id',
			'consultor_type.roleId',
			'consultor_type.name'
		])
		.orderBy('consultor_type.name', pageOptionsDto.order)
		.skip(pageOptionsDto.skip)
		.take(pageOptionsDto.take)

		const [ items, totalCount ] = await queryBuilder.getManyAndCount()

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}

	update(id: number, updateConsultorTypeDto: UpdateConsultorTypeDto) {
		const { name, role } = updateConsultorTypeDto

		const consultor = this.consultorRepository.create({ name, roleId: role })

		return this.consultorRepository.update(id, consultor)
	}

	remove(id: number) {
		return this.consultorRepository.delete(id)
	}
}
