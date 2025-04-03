import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { AccompanimentEntity } from './accompaniment.entity';
import { SessionStatusEntity } from './session_status.entity';
import { SessionPreparationFileEntity } from './session_preparation_file.entity';

@Entity('session')
export class SessionEntity {
	@PrimaryGeneratedColumn({ type: 'int', name: 'id' })
	id: number;

	@Column({ type: 'int', name: 'accompaniment_id' })
	accompanimentId: number;

	@Column({ type: 'varchar', length: 255, name: 'title' })
	title: string;

	@Column({ type: 'datetime', name: 'start_datetime' })
	startDatetime: Date;

	@Column({ type: 'datetime', name: 'end_datetime' })
	endDatetime: Date;

	@Column({ type: 'varchar', length: 255, name: 'conference_link', nullable: true })
	conferenceLink: string | null;

	@Column({ type: 'longtext', name: 'preparation_notes', nullable: true })
	preparationNotes: string | null;

	@Column({ type: 'int', name: 'status_id' })
	statusId: number;

	@Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;

	@Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
	updatedAt: Date;


	//----------------------
	@OneToMany(() => SessionPreparationFileEntity, (file) => file.session)
	preparationFiles: SessionPreparationFileEntity[];


	//----------------------
	@ManyToOne(() => AccompanimentEntity, (accompaniment) => accompaniment.sessions, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'accompaniment_id', referencedColumnName: 'id' })
	accompaniment: AccompanimentEntity;

	@ManyToOne(() => SessionStatusEntity, (sessionStatus) => sessionStatus.sessions, { eager: true, onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'status_id', referencedColumnName: 'id' })
	status: SessionStatusEntity;
}
