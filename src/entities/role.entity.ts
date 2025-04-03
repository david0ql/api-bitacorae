import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserEntity } from './user.entity';
import { ConsultorTypeEntity } from './consultor_type.entity';
import { RolePermissionEntity } from './role_permission.entity';

@Entity('role')
export class RoleEntity {
	@PrimaryGeneratedColumn({ type: 'int', name: 'id' })
	id: number;

	@Column({ type: 'varchar', name: 'name', length: 255 })
	name: string;

	@Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;

	@Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
	updatedAt: Date;

	//----------------------
	@OneToMany(() => UserEntity, (user) => user.role)
	users: UserEntity[];

	@OneToMany(() => ConsultorTypeEntity, (consultorType) => consultorType.role)
	consultorTypes: ConsultorTypeEntity[];

	@OneToMany(() => RolePermissionEntity, (rolePermission) => rolePermission.role)
	rolePermissions: RolePermissionEntity[];
}
