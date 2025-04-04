import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RolePermissionEntity } from './role_permission.entity';

@Entity('permission')
export class PermissionEntity {
	@PrimaryGeneratedColumn({ type: 'int', name: 'id' })
	id: number;

	@Column({ type: 'varchar', name: 'endpoint', length: 255 })
	endpoint: string;

	@Column({ type: 'enum', name: 'method', enum: ['GET', 'POST', 'PATCH', 'DELETE'] })
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE';

	//----------------------
	@OneToMany(() => RolePermissionEntity, (rolePermission) => rolePermission.permission)
	rolePermissions: RolePermissionEntity[];
}
