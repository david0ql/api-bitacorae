import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from "typeorm";
import { PostCategoryEntity } from "./post_category.entity";

@Entity({ name: "post", schema: "dbbitacorae" })
export class PostEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "varchar", length: 255 })
	title: string;

	@Column({ type: "varchar", length: 255, nullable: true })
	image: string | null;

	@Column({ type: "longtext", nullable: true })
	content: string | null;

	@Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
	post_date: Date;

	@CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
	created_at: Date;

	@UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
	updated_at: Date;

	@ManyToMany(() => PostCategoryEntity, (category) => category.posts)
	@JoinTable({
		name: "post_category_rel",
		schema: "dbbitacorae",
		joinColumn: { name: "post_id", referencedColumnName: "id" },
		inverseJoinColumn: { name: "category_id", referencedColumnName: "id" }
	})
	categories: PostCategoryEntity[];
}
