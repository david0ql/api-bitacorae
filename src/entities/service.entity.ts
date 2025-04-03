import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { StrengtheningLevelEntity } from "./strengthening_level.entity";

@Index("level_id", ["levelId"], {})
@Entity("service", { schema: "dbbitacorae" })
export class ServiceEntity {
	@PrimaryGeneratedColumn({ type: "int", name: "id" })
	id: number;

	@Column("varchar", { name: "name", length: 255 })
	name: string;

	@Column("int", { name: "level_id" })
	levelId: number;

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

	@ManyToOne(() => StrengtheningLevelEntity, (strengtheningLevelEntity) => strengtheningLevelEntity.services, {
		onDelete: "RESTRICT",
		onUpdate: "RESTRICT",
	})
	@JoinColumn([{ name: "level_id", referencedColumnName: "id" }])
	level: StrengtheningLevelEntity;
}
