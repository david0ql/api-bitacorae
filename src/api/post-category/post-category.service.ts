import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { PostCategory } from 'src/entities/PostCategory'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreatePostCategoryDto } from './dto/create-post-category.dto'
import { UpdatePostCategoryDto } from './dto/update-post-category.dto'

@Injectable()
export class PostCategoryService {
	constructor(
		@InjectRepository(PostCategory)
		private readonly postCategoryRepository: Repository<PostCategory>
	) {}

	create(createPostCategoryDto: CreatePostCategoryDto) {
		const { name } = createPostCategoryDto

		const postCategory = this.postCategoryRepository.create({ name })

		return this.postCategoryRepository.save(postCategory)
	}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<PostCategory>> {
		const queryBuilder = this.postCategoryRepository.createQueryBuilder('post_category')
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
	}

	update(id: number, updatePostCategoryDto: UpdatePostCategoryDto) {
		if(!id) return { affected: 0 }

		const { name } = updatePostCategoryDto

		const postCategory = this.postCategoryRepository.create({ name })

		return this.postCategoryRepository.update(id, postCategory)
	}

	remove(id: number) {
		if(!id) return { affected: 0 }

		return this.postCategoryRepository.delete(id)
	}
}
