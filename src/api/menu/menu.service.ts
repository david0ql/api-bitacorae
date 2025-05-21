import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Menu } from 'src/entities/Menu'
import { Repository } from 'typeorm'

@Injectable()
export class MenuService {
	constructor(
		@InjectRepository(Menu)
		private readonly menuRepository: Repository<Menu>
	) {}

	buildMenuTree(menus: any[], parentId: number | null = null): any[] {
		return menus
			.filter(menu => menu.parentId === parentId)
			.map(menu => ({
				...menu,
				children: this.buildMenuTree(menus, menu.id)
			}))
	}


	async findAll(roleId: number) {
		const menus = await this.menuRepository.createQueryBuilder('menu')
			.select([
				'menu.id AS id',
				`CASE
					WHEN :roleId IN (3, 4) AND menu.name = 'Publicaciones' THEN 'Inicio'
					ELSE menu.name
				END AS name`,
				'menu.path AS path',
				'menu.parentId AS parentId',
				'`menu`.`order` AS `order`'
			])
			.innerJoin('menu.roles', 'role', 'role.id = :roleId', { roleId })
			.orderBy(
				`CASE
					WHEN :roleId IN (3, 4) AND menu.name = 'Publicaciones' THEN 0
					ELSE 1
				END`, 'ASC'
			)
			.addOrderBy('menu.id', 'ASC')
			.addOrderBy('menu.order', 'ASC')
			.setParameter('roleId', roleId)
			.getRawMany()

		const menuTree = this.buildMenuTree(menus)

		return menuTree
	}
}
