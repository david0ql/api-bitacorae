import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { RolePermission } from "./RolePermission";

@Entity("permission", { schema: "dbbitacorae" })
export class Permission {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "endpoint", length: 255 })
  endpoint: string;

  @Column("enum", { name: "method", enum: ["GET", "POST", "PATCH", "DELETE"] })
  method: "GET" | "POST" | "PATCH" | "DELETE";

  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission
  )
  rolePermissions: RolePermission[];
}
