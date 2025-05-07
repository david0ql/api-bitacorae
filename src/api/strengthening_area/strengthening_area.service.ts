import { Repository } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { StrengtheningArea } from 'src/entities/StrengtheningArea'
import { StrengtheningLevel } from 'src/entities/StrengtheningLevel'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateStrengtheningAreaDto } from './dto/create-strengthening-area.dto'
import { UpdateStrengtheningAreaDto } from './dto/update-strengthening-area.dto'

@Injectable()
export class StrengtheningAreaService {
	constructor(
		@InjectRepository(StrengtheningArea)
		private readonly strengtheningAreaRepository: Repository<StrengtheningArea>,

		@InjectRepository(StrengtheningLevel)
		private readonly strengtheningLevelRepository: Repository<StrengtheningLevel>,

	) { }

	async create(createStrengtheningAreaDto: CreateStrengtheningAreaDto) {
		const { name, level } = createStrengtheningAreaDto

		const strengtheningLevel = await this.strengtheningLevelRepository.findOne({ where: { id: level } })
		if (!strengtheningLevel) {
			throw new BadRequestException(`No se encontró el nivel de experticia con id ${level}`)
		}

		const strengtheningArea = this.strengtheningAreaRepository.create({ name, levelId: level })
		return this.strengtheningAreaRepository.save(strengtheningArea)
	}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<StrengtheningArea>> {
		const queryBuilder = this.strengtheningAreaRepository.createQueryBuilder('strengthening_area')
		.select([
			'strengthening_area.id AS id',
			'strengthening_area.name AS name',
			'strengthening_area.levelId AS levelId',
			'level.name AS levelName'
		])
		.leftJoin('strengthening_area.level', 'level')
		.orderBy('strengthening_area.name', pageOptionsDto.order)
		.skip(pageOptionsDto.skip)
		.take(pageOptionsDto.take)

		const [items, totalCount] = await Promise.all([
			queryBuilder.getRawMany(),
			queryBuilder.getCount()
		])

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })
		return new PageDto(items, pageMetaDto)
	}

	update(id: number, updateStrengtheningAreaDto: UpdateStrengtheningAreaDto) {
		if(!id) return { affected: 0 }

		const { name, level } = updateStrengtheningAreaDto

		return this.strengtheningAreaRepository.update(id, { name, levelId: level })
	}

	async remove(id: number) {
		if(!id) return { affected: 0 }

		try {
			return await this.strengtheningAreaRepository.delete(id)
		} catch (e) {
			throw new BadRequestException(`No se puede eliminar el área de fortalecimiento con id ${id}`)
		}
	}
}
