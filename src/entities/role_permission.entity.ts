import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { RoleEntity } from './role.entity';
import { PermissionEntity } from './permission.entity';

@Entity('role_permission')
export class RolePermissionEntity {
	@PrimaryGeneratedColumn({ type: 'int', name: 'id' })
	id: number;

	@Column({ type: 'int', name: 'role_id' })
	roleId: number;

	@Column({ type: 'int', name: 'permission_id' })
	permissionId: number;

	//----------------------
	@ManyToOne(() => RoleEntity, (role) => role.rolePermissions, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
	role: RoleEntity;

	@ManyToOne(() => PermissionEntity, (permission) => permission.rolePermissions, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'permission_id', referencedColumnName: 'id' })
	permission: PermissionEntity;
}
