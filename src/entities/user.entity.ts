import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ExpertEntity } from './expert.entity';
import { RoleEntity } from './role.entity';
import { BusinessEntity } from './business.entity';

@Entity('user')
export class UserEntity {
	@PrimaryGeneratedColumn({ type: 'int', name: 'id' })
	id: number;

	@Column({ type: 'int', name: 'role_id' })
	roleId: number;

	@Column({ type: 'int', name: 'active' })
	active: number;

	@Column({ type: 'varchar', name: 'name', length: 255 })
	name: string;

	@Column({ type: 'varchar', name: 'email', length: 255, unique: true })
	email: string;

	@Column({ type: 'varchar', name: 'password', length: 255 })
	password: string;

	@Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;

	@Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
	updatedAt: Date;

	//----------------------
	@OneToMany(() => ExpertEntity, (expert) => expert.user)
	experts: ExpertEntity[];

	@OneToMany(() => BusinessEntity, (business) => business.user)
	businesses: BusinessEntity[];

	//----------------------
	@ManyToOne(() => RoleEntity, (role) => role.users, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
	role: RoleEntity;
}
