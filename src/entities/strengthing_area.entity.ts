import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ExpertEntity } from "./expert.entity";
import { ContactInformationEntity } from "./contact_information.entity";
import { BusinessEntity } from "./business.entity";
import { StrengthingLevelEntity } from "./strengthing_level.entity";

@Index("level_id", ["levelId"], {})
@Entity("strengthing_area", { schema: "dbbitacorae" })
export class StrengthingAreaEntity {
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

  @ManyToOne(() => StrengthingLevelEntity, (strengthingLevelEntity) => strengthingLevelEntity.strengthingAreas, {
	onDelete: "RESTRICT",
	onUpdate: "RESTRICT",
	})
  @JoinColumn([{ name: "level_id", referencedColumnName: "id" }])
  level: StrengthingLevelEntity;

  @OneToMany(() => ExpertEntity, (expertEntity) => expertEntity.strengthingArea)
  experts: ExpertEntity[];

  @OneToMany(
    () => ContactInformationEntity,
    (contactInformationEntity) => contactInformationEntity.strengthingArea
  )
  contactInformations: ContactInformationEntity[];

  @OneToMany(
    () => BusinessEntity,
    (businessEntity) => businessEntity.strengthingArea
  )
  businesses: BusinessEntity[];
}
