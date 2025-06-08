import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Auditor } from "./Auditor";
import { Business } from "./Business";
import { ContactInformation } from "./ContactInformation";
import { StrengtheningLevel } from "./StrengtheningLevel";
import { Accompaniment } from "./Accompaniment";
import { Admin } from "./Admin";
import { Expert } from "./Expert";

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

  @ManyToMany(() => Auditor, (auditor) => auditor.strengtheningAreas)
  auditors: Auditor[];

  @ManyToMany(() => Business, (business) => business.strengtheningAreas)
  businesses: Business[];

  @ManyToMany(
    () => ContactInformation,
    (contactInformation) => contactInformation.strengtheningAreas
  )
  contactInformations: ContactInformation[];

  @ManyToOne(
    () => StrengtheningLevel,
    (strengtheningLevel) => strengtheningLevel.strengtheningAreas,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "level_id", referencedColumnName: "id" }])
  level: StrengtheningLevel;

  @ManyToMany(
    () => Accompaniment,
    (accompaniment) => accompaniment.strengtheningAreas
  )
  accompaniments: Accompaniment[];

  @ManyToMany(() => Admin, (admin) => admin.strengtheningAreas)
  admins: Admin[];

  @ManyToMany(() => Expert, (expert) => expert.strengtheningAreas)
  experts: Expert[];
}
