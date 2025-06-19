import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Role } from "./Role";
import { Permission } from "./Permission";

@Index("role_id", ["roleId"], {})
@Index("permission_id", ["permissionId"], {})
@Entity("role_permission")
export class RolePermission {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "role_id" })
  roleId: number;

  @Column("int", { name: "permission_id" })
  permissionId: number;

  @ManyToOne(() => Role, (role) => role.rolePermissions, {
    onDelete: "CASCADE",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "role_id", referencedColumnName: "id" }])
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, {
    onDelete: "CASCADE",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "permission_id", referencedColumnName: "id" }])
  permission: Permission;
}
