import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

import { BusinessEntity } from './business.entity';
import { ExpertEntity } from './expert.entity';
import { SessionEntity } from './session.entity';
import { StrengtheningAreaEntity } from './strengthening_area.entity';

@Entity('accompaniment')
export class AccompanimentEntity {
	@PrimaryGeneratedColumn({ type: 'int', name: 'id' })
	id: number;

	@Column({ type: 'int', name: 'business_id' })
	businessId: number;

	@Column({ type: 'int', name: 'expert_id' })
	expertId: number;

	@Column({ type: 'int', name: 'total_hours' })
	totalHours: number;

	@Column({ type: 'int', name: 'max_hours_per_session' })
	maxHoursPerSession: number;

	@Column({ type: 'int', name: 'strengthening_area_id' })
	strengtheningAreaId: number;

	@Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;

	@Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
	updatedAt: Date;


	//----------------------
	@OneToMany(() => SessionEntity, (session) => session.accompaniment, { cascade: true })
  	sessions: SessionEntity[];


	//----------------------
	@ManyToOne(() => BusinessEntity, (business) => business.accompaniments, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'business_id', referencedColumnName: 'id' })
	business: BusinessEntity;

	@ManyToOne(() => ExpertEntity, (expert) => expert.accompaniments, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'expert_id', referencedColumnName: 'id' })
	expert: ExpertEntity;

	@ManyToOne(() => StrengtheningAreaEntity, (strengtheningArea) => strengtheningArea.accompaniments, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'strengthening_area_id', referencedColumnName: 'id' })
	strengtheningArea: StrengtheningAreaEntity;
}
