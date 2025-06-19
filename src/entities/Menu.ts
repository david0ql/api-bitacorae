import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Role } from "./Role";

@Index("menu_ibfk_1", ["parentId"], {})
@Entity("menu")
export class Menu {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

  @Column("varchar", { name: "path", nullable: true, length: 255 })
  path: string | null;

  @Column("int", { name: "parent_id", nullable: true })
  parentId: number | null;

  @Column("int", { name: "order", nullable: true, default: () => "'0'" })
  order: number | null;

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

  @ManyToOne(() => Menu, (menu) => menu.menus, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "parent_id", referencedColumnName: "id" }])
  parent: Menu;

  @OneToMany(() => Menu, (menu) => menu.parent)
  menus: Menu[];

  @ManyToMany(() => Role, (role) => role.menus)
  roles: Role[];
}
