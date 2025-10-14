import { Injectable, BadRequestException } from '@nestjs/common'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'
import { StrengtheningLevel } from 'src/entities/StrengtheningLevel'
import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateStrengtheningAreaDto } from './dto/create-strengthening-area.dto'
import { UpdateStrengtheningAreaDto } from './dto/update-strengthening-area.dto'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

@Injectable()
export class StrengtheningAreaService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService
	) { }

	async create(createStrengtheningAreaDto: CreateStrengtheningAreaDto, businessName: string) {
		const { name, level } = createStrengtheningAreaDto
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		try {
			const strengtheningAreaRepository = businessDataSource.getRepository(StrengtheningArea)
			const strengtheningLevelRepository = businessDataSource.getRepository(StrengtheningLevel)
			const levelEntity = await strengtheningLevelRepository.findOne({ where: { id: level } })
			if (!levelEntity) throw new BadRequestException('Nivel de fortalecimiento no encontrado')
			const area = strengtheningAreaRepository.create({ name, levelId: level })
			return await strengtheningAreaRepository.save(area)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async findAll(pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<StrengtheningArea>> {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		try {
			const strengtheningAreaRepository = businessDataSource.getRepository(StrengtheningArea)
			const queryBuilder = strengtheningAreaRepository.createQueryBuilder('area')
				.select([
					'area.id',
					'area.name',
					'area.levelId'
				])
				.orderBy('area.name', pageOptionsDto.order)
				.skip(pageOptionsDto.skip)
				.take(pageOptionsDto.take)
			const [items, totalCount] = await Promise.all([
				queryBuilder.getMany(),
				queryBuilder.getCount()
			])
			const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })
			return new PageDto(items, pageMetaDto)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async update(id: number, updateStrengtheningAreaDto: UpdateStrengtheningAreaDto, businessName: string) {
		if (!id) return { affected: 0 }
		const { name, level } = updateStrengtheningAreaDto
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		try {
			const strengtheningAreaRepository = businessDataSource.getRepository(StrengtheningArea)
			return await strengtheningAreaRepository.update(id, { name, levelId: level })
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async remove(id: number, businessName: string) {
		if (!id) return { affected: 0 }
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		try {
			const strengtheningAreaRepository = businessDataSource.getRepository(StrengtheningArea)
			return await strengtheningAreaRepository.delete(id)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}
}
