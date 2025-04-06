import { In, Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { Post } from 'src/entities/Post'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreatePostDto } from './dto/create-post.dto'
import { UpdatePostDto } from './dto/update-post.dto'
import { PostCategory } from 'src/entities/PostCategory'

@Injectable()
export class PostService {
	constructor(
		@InjectRepository(Post)
		private readonly postRepository: Repository<Post>,

		@InjectRepository(PostCategory)
		private readonly postCategoryRepository: Repository<PostCategory>
	) {}

	async create(createPostDto: CreatePostDto) {
		const { title, image, content, categories, postDate } = createPostDto

		const categoryEntities = await this.postCategoryRepository.findBy({
			id: In(categories)
		})

		const newPost = this.postRepository.create({
			title,
			image,
			content,
			postDate,
			postCategories: categoryEntities
		})

		return await this.postRepository.save(newPost)
	}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<Post>> {
		const queryBuilder = this.postRepository.createQueryBuilder('post')
		.select([
			'post.id',
			'post.title',
			'post.image',
			'post.content',
			'post.postDate',
			'post.created_at'
		])
		.addSelect(['category.id', 'category.name'])
		.leftJoin('post.categories', 'category')
		.orderBy('post.id', pageOptionsDto.order)
		.skip(pageOptionsDto.skip)
		.take(pageOptionsDto.take)

		const [items, totalCount] = await queryBuilder.getManyAndCount()

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}

	async update(id: number, updatePostDto: UpdatePostDto) {
		if(!id) return { affected: 0 }

		const { title, image, content, categories, postDate } = updatePostDto

		const post = await this.postRepository.findOne({
			where: { id },
			relations: ['categories']
		})

		if (!post) return { affected: 0 }

		post.title = title ?? post.title
		post.image = image ?? post.image
		post.content = content ?? post.content
		post.postDate = postDate ? new Date(postDate) : post.postDate

		if (categories) {
			const categoryEntities = await this.postCategoryRepository.findBy({
				id: In(categories),
			})

			post.postCategories = categoryEntities.length > 0 ? categoryEntities : []
		}

		await this.postRepository.save(post)

		return { affected: 1 }
	}

	remove(id: number) {
		if(!id) return { affected: 0 }

		return this.postRepository.delete(id)
	}
}
