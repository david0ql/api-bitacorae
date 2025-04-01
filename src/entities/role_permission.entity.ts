import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { RoleEntity } from "./role.entity";
import { PermissionEntity } from "./permission.entity";

@Entity("role_permission", { schema: "dbbitacorae" })
export class RolePermissionEntity {
	@PrimaryGeneratedColumn({ type: "int", name: "id" })
	id: number;

	@Column("int", { name: "role_id" })
	roleId: number;

	@Column("int", { name: "permission_id" })
	permissionId: number;

	@ManyToOne(() => RoleEntity, (role) => role.rolePermissions, { onDelete: "CASCADE" })
	@JoinColumn([{ name: "role_id", referencedColumnName: "id" }])
	role: RoleEntity;

	@ManyToOne(() => PermissionEntity, (permission) => permission.rolePermissions, { onDelete: "CASCADE" })
	@JoinColumn([{ name: "permission_id", referencedColumnName: "id" }])
	permission: PermissionEntity;
}
