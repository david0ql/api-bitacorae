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
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { JwtUser } from '../auth/interfaces/jwt-user.interface'

import envVars from 'src/config/env'

@Injectable()
export class PostService {
	constructor(
		@InjectRepository(Post)
		private readonly postRepository: Repository<Post>,

		@InjectRepository(PostCategory)
		private readonly postCategoryRepository: Repository<PostCategory>,

		private readonly fileUploadService: FileUploadService
	) {}

	async create(createPostDto: CreatePostDto, file?: Express.Multer.File) {
		const { title, content, categories, postDate } = createPostDto
		const fullPath = file ? this.fileUploadService.getFullPath('post', file.filename) : undefined

		try {
			const categoryEntities = await this.postCategoryRepository.findBy({
				id: In(categories)
			})

			const newPost = this.postRepository.create({
				title,
				filePath: fullPath,
				content,
				postDate,
				postCategories: categoryEntities
			})

			return await this.postRepository.save(newPost)	
		} catch (error) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw error
		}
	}

	async findAll(user: JwtUser, pageOptionsDto: PageOptionsDto): Promise<PageDto<Post>> {
		const { roleId } = user
		const { take, skip, order } = pageOptionsDto

		let whereConditions: string[] = []

		if (roleId !== 1) {
			whereConditions.push(`p.post_date >= NOW()`)
		}

		const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : ''

		const sql = `
			SELECT
				p.id AS id,
				p.title AS title,
				CONCAT(?, '/', p.file_path) AS fileUrl,
				p.content AS content,
				p.post_date AS postDate,
				CONCAT('[', GROUP_CONCAT(JSON_OBJECT('id', pc.id, 'name', pc.name)), ']') AS categories,
				p.created_at AS createdAt
			FROM
				post p
				LEFT JOIN post_category_rel pcr ON pcr.post_id = p.id
				LEFT JOIN post_category pc ON pc.id = pcr.category_id
			${whereClause}
			GROUP BY p.id
			ORDER BY p.id ${order}
			LIMIT ${skip}, ${take}
		`

		const countSql = `SELECT COUNT(DISTINCT p.id) as total FROM post p ${whereClause}`

		const [rawItems, countResult] = await Promise.all([
			this.postRepository.query(sql, [envVars.APP_URL]),
			this.postRepository.query(countSql)
		])

		const items = rawItems.map(item => {
			const categories = item.categories ? JSON.parse(item.categories) : []
			return { ...item, categories }
		})

		const totalCount = Number(countResult[0]?.total) ?? 0
		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}

	async update(id: number, updatePostDto: UpdatePostDto, file?: Express.Multer.File) {
		const fullPath = file ? this.fileUploadService.getFullPath('post', file.filename) : undefined
		if(!id) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			return { affected: 0 }
		}

		const { title, content, categories, postDate } = updatePostDto

		const post = await this.postRepository.findOne({
			where: { id },
			relations: ['postCategories']
		})

		if (!post) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			return { affected: 0 }
		}

		try {
			post.title = title ?? post.title
			post.filePath = fullPath ?? post.filePath
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
		} catch (error) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw error
		}
	}

	async remove(id: number) {
		const existing = await this.postRepository.findOneBy({ id })
		if (!existing) return { affected: 0 }

		if (existing.filePath) {
			this.fileUploadService.deleteFile(existing.filePath)
		}

		return this.postRepository.delete(id)
	}
}
