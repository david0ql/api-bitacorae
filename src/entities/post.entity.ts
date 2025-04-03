import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { PostCategoryEntity } from './post_category.entity';

@Entity('post')
export class PostEntity {
	@PrimaryGeneratedColumn({ type: 'int', name: 'id' })
	id: number;

	@Column({ type: 'varchar', length: 255, name: 'title' })
	title: string;

	@Column({ type: 'varchar', length: 255, name: 'image', nullable: true })
	image: string | null;

	@Column({ type: 'longtext', name: 'content', nullable: true })
	content: string | null;

	@Column({ type: 'timestamp', name: 'post_date', default: () => 'CURRENT_TIMESTAMP' })
	postDate: Date;

	@CreateDateColumn({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
	updatedAt: Date;

	//----------------------
	@ManyToMany(() => PostCategoryEntity, (category) => category.posts)
	@JoinTable({
		name: 'post_category_rel',
		schema: 'dbbitacorae',
		joinColumn: { name: 'post_id', referencedColumnName: 'id' },
		inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' }
	})
	categories: PostCategoryEntity[];
}
