import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SessionEntity } from './session.entity';

@Entity('session_preparation_file')
export class SessionPreparationFileEntity {
	@PrimaryGeneratedColumn({ type: 'int', name: 'id' })
	id: number;

	@Column({ type: 'int', name: 'session_id' })
	sessionId: number;

	@Column({ type: 'varchar', length: 255, name: 'file_name' })
	fileName: string;

	@Column({ type: 'varchar', length: 500, name: 'file_url' })
	fileUrl: string;

	@Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;


	//----------------------
	@ManyToOne(() => SessionEntity, (session) => session.preparationFiles, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
	@JoinColumn({ name: 'session_id', referencedColumnName: 'id' })
	session: SessionEntity;
}
