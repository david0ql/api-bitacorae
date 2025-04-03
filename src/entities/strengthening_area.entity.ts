import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ExpertEntity } from './expert.entity';
import { ContactInformationEntity } from './contact_information.entity';
import { BusinessEntity } from './business.entity';
import { StrengtheningLevelEntity } from './strengthening_level.entity';
import { AccompanimentEntity } from './accompaniment.entity';

@Entity('strengthening_area')
export class StrengtheningAreaEntity {
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


	//----------------------
	@ManyToOne(() => StrengtheningLevelEntity, (strengtheningLevel) => strengtheningLevel.strengtheningAreas, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'level_id', referencedColumnName: 'id' })
	level: StrengtheningLevelEntity;


	//----------------------
	@OneToMany(() => ExpertEntity, (expert) => expert.strengtheningArea)
	experts: ExpertEntity[];

	@OneToMany(() => ContactInformationEntity, (contactInformation) => contactInformation.strengtheningArea)
	contactInformations: ContactInformationEntity[];

	@OneToMany(() => BusinessEntity, (business) => business.strengtheningArea)
	businesses: BusinessEntity[];

	@OneToMany(() => AccompanimentEntity, (accompaniment) => accompaniment.strengtheningArea)
	accompaniments: AccompanimentEntity[];
}
