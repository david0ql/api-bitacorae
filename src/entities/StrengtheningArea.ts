import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Expert } from "./Expert";
import { ContactInformation } from "./ContactInformation";
import { Accompaniment } from "./Accompaniment";
import { StrengtheningLevel } from "./StrengtheningLevel";
import { Business } from "./Business";

@Index("strengthening_area_strengthening_level_FK", ["levelId"], {})
@Entity("strengthening_area", { schema: "dbbitacorae" })
export class StrengtheningArea {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

  @Column("int", { name: "level_id", default: () => "'1'" })
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

  @OneToMany(() => Expert, (expert) => expert.strengtheningArea)
  experts: Expert[];

  @OneToMany(
    () => ContactInformation,
    (contactInformation) => contactInformation.strengtheningArea
  )
  contactInformations: ContactInformation[];

  @OneToMany(
    () => Accompaniment,
    (accompaniment) => accompaniment.strengtheningArea
  )
  accompaniments: Accompaniment[];

  @ManyToOne(
    () => StrengtheningLevel,
    (strengtheningLevel) => strengtheningLevel.strengtheningAreas,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "level_id", referencedColumnName: "id" }])
  level: StrengtheningLevel;

  @OneToMany(() => Business, (business) => business.strengtheningArea)
  businesses: Business[];
}
