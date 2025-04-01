import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
} from "typeorm";
import { ExpertEntity } from "./expert.entity";
import { RoleEntity } from "./role.entity";
import { BusinessEntity } from "./business.entity";

@Index("role_id", ["roleId"], {})
@Index("email_unique", ["email"], { unique: true })
@Entity("user", { schema: "dbbitacorae" })
export class UserEntity {
@PrimaryGeneratedColumn({ type: "int", name: "id" })
	id: number;

	@Column("int", { name: "role_id" })
	roleId: number;

	@Column("int", { name: "active" })
	active: number;

	@Column("varchar", { name: "name", length: 255 })
	name: string;

	@Column("varchar", { name: "email", length: 255, unique: true }) // Campo único
	email: string;

	@Column("varchar", { name: "password", length: 255 })
	password: string;

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

	@OneToMany(() => ExpertEntity, (expertEntity) => expertEntity.user)
	experts: ExpertEntity[];

	@ManyToOne(() => RoleEntity, (roleEntity) => roleEntity.users, {
		onDelete: "RESTRICT",
		onUpdate: "RESTRICT",
	})
	@JoinColumn([{ name: "role_id", referencedColumnName: "id" }])
	role: RoleEntity;

	@OneToMany(() => BusinessEntity, (businessEntity) => businessEntity.user)
	businesses: BusinessEntity[];
}
