import { Injectable } from '@nestjs/common'
import { Menu } from 'src/entities/Menu'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

@Injectable()
export class MenuService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService
	) {}

	buildMenuTree(menus: Menu[], parentId: number | null = null): Menu[] {
		return menus
			.filter(menu => menu.parentId === parentId)
			.map(menu => ({
				...menu,
				children: this.buildMenuTree(menus, menu.id)
			}))
	}

	async findAll(roleId: number, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const menuRepository = businessDataSource.getRepository(Menu)
			
			const menus = await menuRepository.createQueryBuilder('menu')
				.select([
					'menu.id',
					'menu.name',
					'menu.path',
					'menu.parentId',
					'menu.order'
				])
				.innerJoin('menu.roles', 'role', 'role.id = :roleId', { roleId })
				.orderBy('menu.id', 'ASC')
				.addOrderBy('menu.order', 'ASC')
				.getMany()

			const menuTree = this.buildMenuTree(menus)

			return menuTree
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}
}
