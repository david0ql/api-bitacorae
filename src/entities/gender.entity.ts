import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ContactInformationEntity } from './contact_information.entity';

@Entity('gender')
export class GenderEntity {
	@PrimaryGeneratedColumn({ type: 'int', name: 'id' })
	id: number;

	@Column({ type: 'varchar', name: 'name', length: 255 })
	name: string;

	@Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;

	@Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
	updatedAt: Date;

	//----------------------
	@OneToMany(() => ContactInformationEntity, (contactInformation) => contactInformation.gender)
	contactInformations: ContactInformationEntity[];
}
