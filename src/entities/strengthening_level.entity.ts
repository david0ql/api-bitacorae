import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { StrengtheningAreaEntity } from "./strengthening_area.entity";
import { ServiceEntity } from "./service.entity";

@Entity("strengthening_level", { schema: "dbbitacorae" })
export class StrengtheningLevelEntity {
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

	@OneToMany(() => StrengtheningAreaEntity, (strengtheningAreaEntity) => strengtheningAreaEntity.level)
	strengtheningAreas: StrengtheningAreaEntity[];

	@OneToMany(() => ServiceEntity, (serviceEntity) => serviceEntity.level)
	services: StrengtheningAreaEntity[];
}
