import { Repository } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { Service } from 'src/entities/Service'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateServiceDto } from './dto/create-service.dto'
import { UpdateServiceDto } from './dto/update-service.dto'
import { StrengtheningLevel } from 'src/entities/StrengtheningLevel'

@Injectable()
export class ServiceService {
	constructor(
		@InjectRepository(Service)
		private readonly serviceRepository: Repository<Service>,

		@InjectRepository(StrengtheningLevel)
		private readonly strengtheningLevelRepository: Repository<StrengtheningLevel>,
	) { }

	async create(createServiceDto: CreateServiceDto) {
		const { name, level } = createServiceDto

		const strengtheningLevel = await this.strengtheningLevelRepository.findOne({ where: { id: level } })
		if (!strengtheningLevel) {
			throw new BadRequestException(`No se encontró el nivel de experticia con id ${level}`)
		}

		const service = this.serviceRepository.create({ name, levelId: level })
		return this.serviceRepository.save(service)
	}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<Service>> {
		const queryBuilder = this.serviceRepository.createQueryBuilder('service')
		.select([
			'service.id AS id',
			'service.name AS name',
			'service.levelId AS levelId',
			'level.name AS levelName'
		])
		.leftJoin('service.level', 'level')
		.orderBy('service.name', pageOptionsDto.order)
		.skip(pageOptionsDto.skip)
		.take(pageOptionsDto.take)

		const [items, totalCount] = await Promise.all([
			queryBuilder.getRawMany(),
			queryBuilder.getCount()
		])

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })
		return new PageDto(items, pageMetaDto)
	}

	update(id: number, updateServiceDto: UpdateServiceDto) {
		if(!id) return { affected: 0 }

		const { name, level } = updateServiceDto

		return this.serviceRepository.update(id, { name, levelId: level })
	}

	remove(id: number) {
		if(!id) return { affected: 0 }

		try {
			return this.serviceRepository.delete(id)
		} catch (e) {
			throw new BadRequestException(`No se puede eliminar el servicio con id ${id}`)
		}

	}
}
