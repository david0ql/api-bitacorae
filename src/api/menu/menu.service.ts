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

	buildMenuTree(menus: Menu[], parentId: number | null = null): Menu[] {
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
	}
}
