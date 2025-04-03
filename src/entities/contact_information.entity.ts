import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

import { BusinessEntity } from './business.entity';
import { DocumentTypeEntity } from './document_type.entity';
import { GenderEntity } from './gender.entity';
import { StrengtheningAreaEntity } from './strengthening_area.entity';
import { EducationLevelEntity } from './education_level.entity';

@Entity('contact_information')
export class ContactInformationEntity {
	@PrimaryGeneratedColumn({ type: 'int', name: 'id' })
	id: number;

	@Column({ type: 'int', name: 'business_id' })
	businessId: number;

	@Column({ type: 'varchar', name: 'first_name', length: 255 })
	firstName: string;

	@Column({ type: 'varchar', name: 'last_name', length: 255 })
	lastName: string;

	@Column({ type: 'varchar', name: 'email', length: 255 })
	email: string;

	@Column({ type: 'varchar', name: 'phone', nullable: true, length: 12 })
	phone: string | null;

	@Column({ type: 'int', name: 'document_type_id', nullable: true })
	documentTypeId: number | null;

	@Column({ type: 'varchar', name: 'document_number', nullable: true, length: 10 })
	documentNumber: string | null;

	@Column({ type: 'varchar', name: 'photo', nullable: true, length: 255 })
	photo: string | null;

	@Column({ type: 'int', name: 'gender_id', nullable: true })
	genderId: number | null;

	@Column({ type: 'int', name: 'experience_years', nullable: true })
	experienceYears: number | null;

	@Column({ type: 'int', name: 'strengthening_area_id', nullable: true })
	strengtheningAreaId: number | null;

	@Column({ type: 'int', name: 'education_level_id', nullable: true })
	educationLevelId: number | null;

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

	@Column({ type: 'longtext', name: 'profile', nullable: true })
	profile: string | null;

	@Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;

	@Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
	updatedAt: Date;

	//----------------------
	@ManyToOne(() => BusinessEntity, (business) => business.contactInformations, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'business_id', referencedColumnName: 'id' })
	business: BusinessEntity;

	@ManyToOne(() => DocumentTypeEntity, (documentType) => documentType.contactInformations, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'document_type_id', referencedColumnName: 'id' })
	documentType: DocumentTypeEntity;

	@ManyToOne(() => GenderEntity, (gender) => gender.contactInformations, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'gender_id', referencedColumnName: 'id' })
	gender: GenderEntity;

	@ManyToOne(() => StrengtheningAreaEntity, (strengtheningArea) => strengtheningArea.contactInformations, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'strengthening_area_id', referencedColumnName: 'id' })
	strengtheningArea: StrengtheningAreaEntity;

	@ManyToOne(() => EducationLevelEntity, (educationLevel) => educationLevel.contactInformations, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'education_level_id', referencedColumnName: 'id' })
	educationLevel: EducationLevelEntity;
}
