import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "./user.entity";
import { ConsultorTypeEntity } from "./consultor_type.entity";
import { RolePermissionEntity } from "./role_permission.entity";

@Entity("role", { schema: "dbbitacorae" })
export class RoleEntity {
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

	@OneToMany(() => UserEntity, (userEntity) => userEntity.role)
	users: UserEntity[];

	@OneToMany(() => ConsultorTypeEntity, (consultorTypeEntity) => consultorTypeEntity.role)
	consultorTypes: ConsultorTypeEntity[];

	@OneToMany(() => RolePermissionEntity, (rolePermission) => rolePermission.role)
	rolePermissions: RolePermissionEntity[];
}
