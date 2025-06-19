import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Business } from "./Business";

@Entity("economic_activity")
export class EconomicActivity {
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

  @ManyToMany(() => Business, (business) => business.economicActivities)
  businesses: Business[];
}
