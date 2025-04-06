import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { PostCategory } from "./PostCategory";

@Entity("post", { schema: "dbbitacorae" })
export class Post {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "title", length: 255 })
  title: string;

  @Column("varchar", { name: "image", nullable: true, length: 255 })
  image: string | null;

  @Column("longtext", { name: "content" })
  content: string;

  @Column("timestamp", {
    name: "post_date",
    default: () => "CURRENT_TIMESTAMP",
  })
  postDate: Date;

  @Column("timestamp", {
    name: "created_at",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @Column("timestamp", {
    name: "updated_at",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;

  @ManyToMany(() => PostCategory, (postCategory) => postCategory.posts)
  @JoinTable({
    name: "post_category_rel",
    joinColumns: [{ name: "post_id", referencedColumnName: "id" }],
    inverseJoinColumns: [{ name: "category_id", referencedColumnName: "id" }],
    schema: "dbbitacorae",
  })
  postCategories: PostCategory[];
}
