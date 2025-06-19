import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Business } from "./Business";

@Entity("business_size")
export class BusinessSize {
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

  @OneToMany(() => Business, (business) => business.businessSize)
  businesses: Business[];
}
