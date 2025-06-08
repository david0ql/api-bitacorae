import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Session } from "./Session";
import { Business } from "./Business";
import { Expert } from "./Expert";
import { StrengtheningArea } from "./StrengtheningArea";

@Index("business_id", ["businessId"], {})
@Index("expert_id", ["expertId"], {})
@Entity("accompaniment", { schema: "dbbitacorae" })
export class Accompaniment {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "business_id" })
  businessId: number;

  @Column("int", { name: "expert_id" })
  expertId: number;

  @Column("int", { name: "total_hours" })
  totalHours: number;

  @Column("int", { name: "max_hours_per_session" })
  maxHoursPerSession: number;

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

  @OneToMany(() => Session, (session) => session.accompaniment)
  sessions: Session[];

  @ManyToOne(() => Business, (business) => business.accompaniments, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "business_id", referencedColumnName: "id" }])
  business: Business;

  @ManyToOne(() => Expert, (expert) => expert.accompaniments, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "expert_id", referencedColumnName: "id" }])
  expert: Expert;

  @ManyToMany(
    () => StrengtheningArea,
    (strengtheningArea) => strengtheningArea.accompaniments
  )
  @JoinTable({
    name: "accompaniment_strengthening_area_rel",
    joinColumns: [{ name: "accompaniment_id", referencedColumnName: "id" }],
    inverseJoinColumns: [
      { name: "strengthening_area_id", referencedColumnName: "id" },
    ],
    schema: "dbbitacorae",
  })
  strengtheningAreas: StrengtheningArea[];
}
