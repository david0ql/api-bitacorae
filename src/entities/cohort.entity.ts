import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BusinessEntity } from './business.entity';

@Entity('cohort')
export class CohortEntity {
	@PrimaryGeneratedColumn({ type: 'int', name: 'id' })
	id: number;

	@Column({ type: 'varchar', name: 'name', length: 255 })
	name: string;

	@Column({ type: 'int', name: 'order' })
	order: number;

	@Column({ type: 'date', name: 'start_date' })
	startDate: string;

	@Column({ type: 'date', name: 'end_date' })
	endDate: string;

	@Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;

	@Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
	updatedAt: Date;

	//----------------------
	@OneToMany(() => BusinessEntity, (business) => business.cohort)
	businesses: BusinessEntity[];
}
