import { In } from 'typeorm'
import { Injectable } from '@nestjs/common'

import { Post } from 'src/entities/Post'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreatePostDto } from './dto/create-post.dto'
import { UpdatePostDto } from './dto/update-post.dto'
import { PostCategory } from 'src/entities/PostCategory'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { DateService } from 'src/services/date/date.service'
import { JwtUser } from '../auth/interfaces/jwt-user.interface'

import envVars from 'src/config/env'

@Injectable()
export class PostService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService,
		private readonly fileUploadService: FileUploadService,
		private readonly dateService: DateService
	) {}

	async create(createPostDto: CreatePostDto, businessName: string, file?: Express.Multer.File) {
		const { title, content, categories, postDate } = createPostDto
		
		if (!businessName) {
			throw new Error('Se requiere especificar una empresa para crear el post')
		}

		const fullPath = file ? this.fileUploadService.getFullPath('post', file.filename) : undefined

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const postRepository = businessDataSource.getRepository(Post)
			const postCategoryRepository = businessDataSource.getRepository(PostCategory)

			const categoryEntities = await postCategoryRepository.findBy({
				id: In(categories)
			})

			const newPost = postRepository.create({
				title,
				filePath: fullPath,
				content,
				postDate,
				postCategories: categoryEntities
			})

			return await postRepository.save(newPost)
		} catch (e) {
			if (fullPath) this.fileUploadService.deleteFile(fullPath)
			throw e
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async findAll(user: JwtUser, pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<Post>> {
		const { roleId } = user
		const { take, skip, order } = pageOptionsDto

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			let whereConditions: string[] = []

			if (roleId !== 1) {
				whereConditions.push(`DATE(p.post_date) <=  NOW()`)
			}

			const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : ''

			const sql = `
				SELECT
					p.id AS id,
					p.title AS title,
					CONCAT(?, '/', p.file_path) AS fileUrl,
					p.content AS content,
					IF(COUNT(pc.id) > 0,
						CONCAT('[',
							GROUP_CONCAT(DISTINCT JSON_OBJECT(
								'value', pc.id,
								'label', pc.name
							)),
						']'),
						NULL
					) AS categories,
					p.post_date AS postDateBase,
					DATE_FORMAT(p.post_date, '%Y-%m-%d %H:%i:%s') AS postDate,
					p.created_at AS createdAtBase,
					DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt
				FROM
					post p
					LEFT JOIN post_category_rel pcr ON pcr.post_id = p.id
					LEFT JOIN post_category pc ON pc.id = pcr.category_id
				${whereClause}
				GROUP BY p.id
				ORDER BY p.id ${order}
				LIMIT ${skip}, ${take}
			`

			const countSql = `SELECT COUNT(DISTINCT p.id) AS total FROM post p ${whereClause}`

			const [rawItems, countResult] = await Promise.all([
				businessDataSource.query(sql, [envVars.APP_URL]),
				businessDataSource.query(countSql)
			])

			const items = rawItems.map(item => {
				const categories = item.categories ? JSON.parse(item.categories) : []
				return {
					...item,
					postDateFormat: this.dateService.formatDate(item.postDateBase),
					createdAtFormat: this.dateService.formatDate(item.createdAtBase),
					categories
				}
			})

			const totalCount = Number(countResult[0]?.total) ?? 0
			const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

			return new PageDto(items, pageMetaDto)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async findLast(businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sql = `
				SELECT
					p.id AS id,
					p.title AS title,
					CONCAT(?, '/', p.file_path) AS fileUrl,
					p.content AS content,
					IF(COUNT(pc.id) > 0,
						CONCAT('[',
							GROUP_CONCAT(DISTINCT JSON_OBJECT(
								'value', pc.id,
								'label', pc.name
							)),
						']'),
						NULL
					) AS categories,
					p.post_date AS postDateBase,
					DATE_FORMAT(p.post_date, '%Y-%m-%d %H:%i:%s') AS postDate,
					p.created_at AS createdAtBase,
					DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt
				FROM
					post p
					LEFT JOIN post_category_rel pcr ON pcr.post_id = p.id
					LEFT JOIN post_category pc ON pc.id = pcr.category_id
				WHERE DATE(p.post_date) <= NOW()
				GROUP BY p.id
				ORDER BY p.id DESC
				LIMIT 1
			`

			const rawItems = await businessDataSource.query(sql, [envVars.APP_URL])
			const items = rawItems.map(item => {
				const categories = item.categories ? JSON.parse(item.categories) : []
				return {
					...item,
					postDateFormat: this.dateService.formatDate(item.postDateBase),
					createdAtFormat: this.dateService.formatDate(item.createdAtBase),
					categories
				}
			})

			return items[0]
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async update(id: number, updatePostDto: UpdatePostDto, businessName: string, file?: Express.Multer.File) {
		if (!businessName) {
			throw new Error('Se requiere especificar una empresa para actualizar el post')
		}

		const fullPath = file ? this.fileUploadService.getFullPath('post', file.filename) : undefined
		if(!id) {
			if (fullPath) this.fileUploadService.deleteFile(fullPath)
			return { affected: 0 }
		}

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const postRepository = businessDataSource.getRepository(Post)
			const postCategoryRepository = businessDataSource.getRepository(PostCategory)

			const { title, content, categories, postDate } = updatePostDto

			const post = await postRepository.findOne({
				where: { id },
				relations: ['postCategories']
			})

			if (!post) {
				if (fullPath) this.fileUploadService.deleteFile(fullPath)
				return { affected: 0 }
			}

			post.title = title ?? post.title
			post.filePath = fullPath ?? post.filePath
			post.content = content ?? post.content
			if (postDate) {
				post.postDate = this.dateService.parseToDate(postDate)
			}

			if (categories) {
				const categoryEntities = await postCategoryRepository.findBy({
					id: In(categories),
				})
				post.postCategories = categoryEntities.length > 0 ? categoryEntities : []
			}

			await postRepository.save(post)

			return { affected: 1 }
		} catch (e) {
			if (fullPath) this.fileUploadService.deleteFile(fullPath)
			throw e
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async remove(id: number, businessName: string) {
		if(!id) return { affected: 0 }

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const postRepository = businessDataSource.getRepository(Post)
			return await postRepository.delete(id)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}
}
