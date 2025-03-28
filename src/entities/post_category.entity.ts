import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany } from "typeorm";
import { PostEntity } from "./post.entity";

@Entity({ name: "post_category", schema: "dbbitacorae" })
export class PostCategoryEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "varchar", length: 255 })
	name: string;

	@CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
	created_at: Date;

	@UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
	updated_at: Date;

	@ManyToMany(() => PostEntity, (post) => post.categories)
	posts: PostEntity[];
}
