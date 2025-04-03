import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	OneToMany,
	JoinColumn
} from 'typeorm';

import { ContactInformationEntity } from './contact_information.entity';
import { UserEntity } from './user.entity';
import { DocumentTypeEntity } from './document_type.entity';
import { EconomicActivityEntity } from './economic_activity.entity';
import { BusinessSizeEntity } from './business_size.entity';
import { PositionEntity } from './position.entity';
import { ProductStatusEntity } from './product_status.entity';
import { MarketScopeEntity } from './market_scope.entity';
import { StrengtheningAreaEntity } from './strengthening_area.entity';
import { CohortEntity } from './cohort.entity';
import { AccompanimentEntity } from './accompaniment.entity';

@Entity('business')
export class BusinessEntity {
	@PrimaryGeneratedColumn({ type: 'int', name: 'id' })
	id: number;

	@Column({ type: 'int', name: 'user_id' })
	userId: number;

	@Column({ type: 'varchar', name: 'social_reason', length: 255 })
	socialReason: string;

	@Column({ type: 'int', name: 'document_type_id' })
	documentTypeId: number;

	@Column({ type: 'varchar', name: 'document_number', length: 10 })
	documentNumber: string;

	@Column({ type: 'varchar', name: 'address', length: 255 })
	address: string;

	@Column({ type: 'varchar', name: 'phone', length: 12 })
	phone: string;

	@Column({ type: 'varchar', name: 'email', length: 255 })
	email: string;

	@Column({ type: 'int', name: 'economic_activity_id' })
	economicActivityId: number;

	@Column({ type: 'int', name: 'business_size_id' })
	businessSizeId: number;

	@Column({ type: 'int', name: 'number_of_employees' })
	numberOfEmployees: number;

	@Column({ type: 'double', name: 'last_year_sales' })
	lastYearSales: number;

	@Column({ type: 'double', name: 'two_years_ago_sales' })
	twoYearsAgoSales: number;

	@Column({ type: 'double', name: 'three_years_ago_sales' })
	threeYearsAgoSales: number;

	@Column({ type: 'varchar', name: 'facebook', nullable: true, length: 255 })
	facebook: string | null;

	@Column({ type: 'varchar', name: 'instagram', nullable: true, length: 255 })
	instagram: string | null;

	@Column({ type: 'varchar', name: 'twitter', nullable: true, length: 255 })
	twitter: string | null;

	@Column({ type: 'varchar', name: 'website', nullable: true, length: 255 })
	website: string | null;

	@Column({ type: 'varchar', name: 'linkedin', nullable: true, length: 255 })
	linkedin: string | null;

	@Column({ type: 'int', name: 'position_id' })
	positionId: number;

	@Column({ type: 'tinyint', name: 'has_founded_before', nullable: true })
	hasFoundedBefore: boolean | null;

	@Column({ type: 'longtext', name: 'observation', nullable: true })
	observation: string | null;

	@Column({ type: 'int', name: 'number_of_people_leading' })
	numberOfPeopleLeading: number;

	@Column({ type: 'int', name: 'product_status_id' })
	productStatusId: number;

	@Column({ type: 'int', name: 'market_scope_id' })
	marketScopeId: number;

	@Column({ type: 'longtext', name: 'business_plan', nullable: true })
	businessPlan: string | null;

	@Column({ type: 'longtext', name: 'business_segmentation', nullable: true })
	businessSegmentation: string | null;

	@Column({ type: 'int', name: 'strengthening_area_id' })
	strengtheningAreaId: number;

	@Column({ type: 'int', name: 'assigned_hours' })
	assignedHours: number;

	@Column({ type: 'int', name: 'cohort_id' })
	cohortId: number;

	@Column({ type: 'longtext', name: 'diagnostic', nullable: true })
	diagnostic: string | null;

	@Column({ type: 'text', name: 'evidence', nullable: true })
	evidence: string | null;

	@Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;

	@Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
	updatedAt: Date;


	//----------------------
	@OneToMany(() => ContactInformationEntity, (contact) => contact.business)
	contactInformations: ContactInformationEntity[];

	@OneToMany(() => AccompanimentEntity, (accompaniment) => accompaniment.business)
	accompaniments: AccompanimentEntity[];


	//----------------------
	@ManyToOne(() => UserEntity, (user) => user.businesses, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
	user: UserEntity;

	@ManyToOne(() => DocumentTypeEntity, (documentType) => documentType.businesses, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'document_type_id', referencedColumnName: 'id' })
	documentType: DocumentTypeEntity;

	@ManyToOne(() => EconomicActivityEntity, (economicActivity) => economicActivity.businesses, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'economic_activity_id', referencedColumnName: 'id' })
	economicActivity: EconomicActivityEntity;

	@ManyToOne(() => BusinessSizeEntity, (businessSize) => businessSize.businesses, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'business_size_id', referencedColumnName: 'id' })
	businessSize: BusinessSizeEntity;

	@ManyToOne(() => PositionEntity, (position) => position.businesses, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'position_id', referencedColumnName: 'id' })
	position: PositionEntity;

	@ManyToOne(() => ProductStatusEntity, (productStatus) => productStatus.businesses, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'product_status_id', referencedColumnName: 'id' })
	productStatus: ProductStatusEntity;

	@ManyToOne(() => MarketScopeEntity, (marketScope) => marketScope.businesses, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'market_scope_id', referencedColumnName: 'id' })
	marketScope: MarketScopeEntity;

	@ManyToOne(() => StrengtheningAreaEntity, (strengtheningArea) => strengtheningArea.businesses, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'strengthening_area_id', referencedColumnName: 'id' })
	strengtheningArea: StrengtheningAreaEntity;

	@ManyToOne(() => CohortEntity, (cohort) => cohort.businesses, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'cohort_id', referencedColumnName: 'id' })
	cohort: CohortEntity;
}
