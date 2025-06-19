import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Admin } from "./Admin";
import { Expert } from "./Expert";
import { ContactInformation } from "./ContactInformation";
import { Business } from "./Business";
import { Auditor } from "./Auditor";

@Entity("document_type")
export class DocumentType {
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

  @OneToMany(() => Admin, (admin) => admin.documentType)
  admins: Admin[];

  @OneToMany(() => Expert, (expert) => expert.documentType)
  experts: Expert[];

  @OneToMany(
    () => ContactInformation,
    (contactInformation) => contactInformation.documentType
  )
  contactInformations: ContactInformation[];

  @OneToMany(() => Business, (business) => business.documentType)
  businesses: Business[];

  @OneToMany(() => Auditor, (auditor) => auditor.documentType)
  auditors: Auditor[];
}
