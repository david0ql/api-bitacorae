import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ContactInformationEntity } from "./contact_information.entity";

@Entity("gender", { schema: "dbbitacorae" })
export class GenderEntity {
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

  @OneToMany(
    () => ContactInformationEntity,
    (contactInformationEntity) => contactInformationEntity.gender
  )
  contactInformations: ContactInformationEntity[];
}
