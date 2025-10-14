import { Injectable } from '@nestjs/common'
import { Repository, DataSource, ObjectLiteral } from 'typeorm'
import { DynamicDatabaseService } from './dynamic-database.service'

@Injectable()
export class DynamicEntityService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService
	) {}

	async getRepository<T extends ObjectLiteral>(entity: any, businessName: string): Promise<Repository<T>> {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		
		if (!businessDataSource) {
			throw new Error('No se pudo conectar a la base de datos de la empresa')
		}

		return businessDataSource.getRepository(entity) as Repository<T>
	}

	async executeWithBusinessConnection<T>(
		businessName: string,
		operation: (dataSource: DataSource) => Promise<T>
	): Promise<T> {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		
		if (!businessDataSource) {
			throw new Error('No se pudo conectar a la base de datos de la empresa')
		}

		try {
			return await operation(businessDataSource)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async executeWithRepository<T extends ObjectLiteral, R>(
		businessName: string,
		entity: any,
		operation: (repository: Repository<T>) => Promise<R>
	): Promise<R> {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		
		if (!businessDataSource) {
			throw new Error('No se pudo conectar a la base de datos de la empresa')
		}

		try {
			const repository = businessDataSource.getRepository(entity) as Repository<T>
			return await operation(repository)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}
} 