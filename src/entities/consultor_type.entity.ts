import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ExpertEntity } from './expert.entity';
import { RoleEntity } from './role.entity';

@Entity('consultor_type')
export class ConsultorTypeEntity {
	@PrimaryGeneratedColumn({ type: 'int', name: 'id' })
	id: number;

	@Column({ type: 'int', name: 'role_id' })
	roleId: number;

	@Column({ type: 'varchar', name: 'name', length: 255 })
	name: string;

	@Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;

	@Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
	updatedAt: Date;

	//----------------------
	@OneToMany(() => ExpertEntity, (expert) => expert.consultorType)
	experts: ExpertEntity[];

	//----------------------
	@ManyToOne(() => RoleEntity, (role) => role.consultorTypes, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
	role: RoleEntity;
}
