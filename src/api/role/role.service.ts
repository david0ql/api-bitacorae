import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { RoleEntity } from 'src/entities/role.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Injectable()
export class RoleService {
	constructor(
		@InjectRepository(RoleEntity)
		private readonly rolRepository: Repository<RoleEntity>
	) {}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<RoleEntity>> {
		const queryBuilder = this.rolRepository.createQueryBuilder('role')
		.select([
			'role.id',
			'role.name'
		])
		.orderBy('role.id', pageOptionsDto.order)
		.skip(pageOptionsDto.skip)
		.take(pageOptionsDto.take)

		const [ items, totalCount ] = await queryBuilder.getManyAndCount()

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}
}
