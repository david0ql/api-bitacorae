import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Business } from "./Business";

@Entity("product_status", { schema: "dbbitacorae" })
export class ProductStatus {
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

  @OneToMany(() => Business, (business) => business.productStatus)
  businesses: Business[];
}
