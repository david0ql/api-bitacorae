import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { StrengthingAreaEntity } from "./strengthing_area.entity";
import { ServiceEntity } from "./service.entity";

@Entity("strengthing_level", { schema: "dbbitacorae" })
export class StrengthingLevelEntity {
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

	@OneToMany(() => StrengthingAreaEntity, (strengthingAreaEntity) => strengthingAreaEntity.level)
	strengthingAreas: StrengthingAreaEntity[];

	@OneToMany(() => ServiceEntity, (serviceEntity) => serviceEntity.level)
	services: StrengthingAreaEntity[];
}
