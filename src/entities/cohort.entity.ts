import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { BusinessEntity } from "./business.entity";

@Entity("cohort", { schema: "dbbitacorae" })
export class CohortEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

  @Column("int", { name: "order" })
  order: number;

  @Column("date", { name: "start_date" })
  startDate: string;

  @Column("date", { name: "end_date" })
  endDate: string;

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

  @OneToMany(() => BusinessEntity, (businessEntity) => businessEntity.cohort)
  businesses: BusinessEntity[];
}
