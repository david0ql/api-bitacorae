import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SessionEntity } from './session.entity';

@Entity('session_status')
export class SessionStatusEntity {
	@PrimaryGeneratedColumn({ type: 'int', name: 'id' })
	id: number;

	@Column({ type: 'varchar', length: 50, name: 'name' })
	name: string;

	@Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;


	//----------------------
	@OneToMany(() => SessionEntity, (session) => session.status)
	sessions: SessionEntity[];
}
