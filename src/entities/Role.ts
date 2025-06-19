import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ConsultorType } from "./ConsultorType";
import { User } from "./User";
import { RolePermission } from "./RolePermission";
import { Menu } from "./Menu";

@Entity("role")
export class Role {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

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

  @OneToMany(() => ConsultorType, (consultorType) => consultorType.role)
  consultorTypes: ConsultorType[];

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[];

  @ManyToMany(() => Menu, (menu) => menu.roles)
  @JoinTable({
    name: "role_menu",
    joinColumns: [{ name: "role_id", referencedColumnName: "id" }],
    inverseJoinColumns: [{ name: "menu_id", referencedColumnName: "id" }]
  })
  menus: Menu[];
}
