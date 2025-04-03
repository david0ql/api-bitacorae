import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { StrengtheningAreaEntity } from './strengthening_area.entity';
import { ServiceEntity } from './service.entity';

@Entity('strengthening_level')
export class StrengtheningLevelEntity {
	@PrimaryGeneratedColumn({ type: 'int', name: 'id' })
	id: number;

	@Column({ type: 'varchar', name: 'name', length: 255 })
	name: string;

	@Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;

	@Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
	updatedAt: Date;

	//----------------------
	@OneToMany(() => StrengtheningAreaEntity, (strengtheningArea) => strengtheningArea.level)
	strengtheningAreas: StrengtheningAreaEntity[];

	@OneToMany(() => ServiceEntity, (service) => service.level)
	services: ServiceEntity[];
}
