import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { BusinessEntity } from "./business.entity";

@Entity("economic_activity", { schema: "dbbitacorae" })
export class EconomicActivityEntity {
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
    () => BusinessEntity,
    (businessEntity) => businessEntity.economicActivity
  )
  businesses: BusinessEntity[];
}
