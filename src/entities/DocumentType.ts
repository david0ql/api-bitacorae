import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Expert } from "./Expert";
import { ContactInformation } from "./ContactInformation";
import { Business } from "./Business";

@Entity("document_type", { schema: "dbbitacorae" })
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

  @OneToMany(() => Expert, (expert) => expert.documentType)
  experts: Expert[];

  @OneToMany(
    () => ContactInformation,
    (contactInformation) => contactInformation.documentType
  )
  contactInformations: ContactInformation[];

  @OneToMany(() => Business, (business) => business.documentType)
  businesses: Business[];
}
