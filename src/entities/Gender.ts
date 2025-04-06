import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Expert } from "./Expert";
import { ContactInformation } from "./ContactInformation";

@Entity("gender", { schema: "dbbitacorae" })
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

  @OneToMany(() => Expert, (expert) => expert.gender)
  experts: Expert[];

  @OneToMany(
    () => ContactInformation,
    (contactInformation) => contactInformation.gender
  )
  contactInformations: ContactInformation[];
}
