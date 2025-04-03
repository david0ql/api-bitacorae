import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ExpertEntity } from "./expert.entity";
import { ContactInformationEntity } from "./contact_information.entity";
import { BusinessEntity } from "./business.entity";
import { StrengtheningLevelEntity } from "./strengthening_level.entity";

@Index("level_id", ["levelId"], {})
@Entity("strengthening_area", { schema: "dbbitacorae" })
export class StrengtheningAreaEntity {
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

  @ManyToOne(() => StrengtheningLevelEntity, (strengtheningLevelEntity) => strengtheningLevelEntity.strengtheningAreas, {
	onDelete: "RESTRICT",
	onUpdate: "RESTRICT",
	})
  @JoinColumn([{ name: "level_id", referencedColumnName: "id" }])
  level: StrengtheningLevelEntity;

  @OneToMany(() => ExpertEntity, (expertEntity) => expertEntity.strengtheningArea)
  experts: ExpertEntity[];

  @OneToMany(
    () => ContactInformationEntity,
    (contactInformationEntity) => contactInformationEntity.strengtheningArea
  )
  contactInformations: ContactInformationEntity[];

  @OneToMany(
    () => BusinessEntity,
    (businessEntity) => businessEntity.strengtheningArea
  )
  businesses: BusinessEntity[];
}
