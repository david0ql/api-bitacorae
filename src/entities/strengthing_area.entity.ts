import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ExpertEntity } from "./expert.entity";
import { ContactInformationEntity } from "./contact_information.entity";
import { BusinessEntity } from "./business.entity";

@Entity("strengthing_area", { schema: "dbbitacorae" })
export class StrengthingAreaEntity {
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
