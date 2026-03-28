import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { StrengtheningLevel } from "./StrengtheningLevel";
import { Business } from "./Business";

@Index("service_strengthening_level_FK", ["levelId"], {})
@Entity("service")
export class Service {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

  @Column("int", { name: "level_id", default: () => "'1'" })
  levelId: number;

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

  @ManyToOne(
    () => StrengtheningLevel,
    (strengtheningLevel) => strengtheningLevel.services,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "level_id", referencedColumnName: "id" }])
  level: StrengtheningLevel;

  @OneToMany(() => Business, (business) => business.service)
  businesses: Business[];
}
