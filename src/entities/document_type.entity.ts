import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ExpertEntity } from './expert.entity';
import { ContactInformationEntity } from './contact_information.entity';
import { BusinessEntity } from './business.entity';

@Entity('document_type')
export class DocumentTypeEntity {
	@PrimaryGeneratedColumn({ type: 'int', name: 'id' })
	id: number;

	@Column({ type: 'varchar', name: 'name', length: 255 })
	name: string;

	@Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;

	@Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
	updatedAt: Date;

	//----------------------
	@OneToMany(() => ExpertEntity, (expert) => expert.documentType)
	experts: ExpertEntity[];

	@OneToMany(() => ContactInformationEntity, (contactInformation) => contactInformation.documentType)
	contactInformations: ContactInformationEntity[];

	@OneToMany(() => BusinessEntity, (business) => business.documentType)
	businesses: BusinessEntity[];
}
