import { Injectable } from '@nestjs/common'

import { PostCategory } from 'src/entities/PostCategory'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreatePostCategoryDto } from './dto/create-post-category.dto'
import { UpdatePostCategoryDto } from './dto/update-post-category.dto'

@Injectable()
export class PostCategoryService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService
	) {}

	async create(createPostCategoryDto: CreatePostCategoryDto, businessName: string) {
		const { name } = createPostCategoryDto

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const postCategoryRepository = businessDataSource.getRepository(PostCategory)
			const postCategory = postCategoryRepository.create({ name })
			return await postCategoryRepository.save(postCategory)
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async findAll(pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<PostCategory>> {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const postCategoryRepository = businessDataSource.getRepository(PostCategory)
			
			const queryBuilder = postCategoryRepository.createQueryBuilder('post_category')
				.select([
					'post_category.id',
					'post_category.name'
				])
				.orderBy('post_category.name', pageOptionsDto.order)
				.skip(pageOptionsDto.skip)
				.take(pageOptionsDto.take)

			const [ items, totalCount ] = await queryBuilder.getManyAndCount()

			const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

			return new PageDto(items, pageMetaDto)
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async update(id: number, updatePostCategoryDto: UpdatePostCategoryDto, businessName: string) {
		if(!id) return { affected: 0 }

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const postCategoryRepository = businessDataSource.getRepository(PostCategory)
			const { name } = updatePostCategoryDto
			return await postCategoryRepository.update(id, { name })
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async remove(id: number, businessName: string) {
		if(!id) return { affected: 0 }

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const postCategoryRepository = businessDataSource.getRepository(PostCategory)
			return await postCategoryRepository.delete(id)
		} catch (e) {
			throw new Error(`No se pudo eliminar la categoría de publicación con id ${id}`)
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}
}
