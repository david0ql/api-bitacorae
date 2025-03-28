import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { ServiceEntity } from 'src/entities/service.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateServiceDto } from './dto/create-service.dto'
import { UpdateServiceDto } from './dto/update-service.dto'

@Injectable()
export class ServiceService {
	constructor(
		@InjectRepository(ServiceEntity)
		private readonly serviceRepository: Repository<ServiceEntity>
	) { }

	create(createServiceDto: CreateServiceDto) {
		const { name, level } = createServiceDto

		const service = this.serviceRepository.create({ name, levelId: level })

		return this.serviceRepository.save(service)
	}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<ServiceEntity>> {
		const queryBuilder = this.serviceRepository.createQueryBuilder('service')
		.select([
			'service.id',
			'service.name',
			'service.levelId',
		])
		.orderBy('service.name', pageOptionsDto.order)
		.skip(pageOptionsDto.skip)
		.take(pageOptionsDto.take)

		const [ items, totalCount ] = await queryBuilder.getManyAndCount()

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}

	update(id: number, updateServiceDto: UpdateServiceDto) {
		if(!id) return { affected: 0 }

		const { name, level } = updateServiceDto

		const service = this.serviceRepository.create({ name, levelId: level })

		return this.serviceRepository.update(id, service)
	}

	remove(id: number) {
		if(!id) return { affected: 0 }

		return this.serviceRepository.delete(id)
	}
}
