import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Admin } from "./Admin";
import { Expert } from "./Expert";
import { ContactInformation } from "./ContactInformation";
import { Auditor } from "./Auditor";

@Entity("gender")
export class Gender {
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

  @OneToMany(() => Admin, (admin) => admin.gender)
  admins: Admin[];

  @OneToMany(() => Expert, (expert) => expert.gender)
  experts: Expert[];

  @OneToMany(
    () => ContactInformation,
    (contactInformation) => contactInformation.gender
  )
  contactInformations: ContactInformation[];

  @OneToMany(() => Auditor, (auditor) => auditor.gender)
  auditors: Auditor[];
}
