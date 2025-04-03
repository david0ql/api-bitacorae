import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { StrengtheningLevelEntity } from './strengthening_level.entity';

@Entity('service')
export class ServiceEntity {
	@PrimaryGeneratedColumn({ type: 'int', name: 'id' })
	id: number;

	@Column({ type: 'varchar', name: 'name', length: 255 })
	name: string;

	@Column({ type: 'int', name: 'level_id' })
	levelId: number;

	@Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;

	@Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
	updatedAt: Date;

	// ----------------------
	@ManyToOne(() => StrengtheningLevelEntity, (strengtheningLevel) => strengtheningLevel.services, {
		onDelete: 'RESTRICT', onUpdate: 'RESTRICT'
	})
	@JoinColumn({ name: 'level_id', referencedColumnName: 'id' })
	level: StrengtheningLevelEntity;
}
