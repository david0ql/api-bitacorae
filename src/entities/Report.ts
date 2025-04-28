import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ReportType } from "./ReportType";
import { Business } from "./Business";
import { Expert } from "./Expert";
import { Session } from "./Session";

@Index("report_report_type_FK", ["reportTypeId"], {})
@Index("session_id", ["sessionId"], {})
@Index("expert_id", ["expertId"], {})
@Index("business_id", ["businessId"], {})
@Entity("report", { schema: "dbbitacorae" })
export class Report {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

  @Column("int", { name: "report_type_id", default: () => "'1'" })
  reportTypeId: number;

  @Column("int", { name: "session_id", nullable: true })
  sessionId: number | null;

  @Column("int", { name: "expert_id", nullable: true })
  expertId: number | null;

  @Column("int", { name: "business_id", nullable: true })
  businessId: number | null;

  @Column("varchar", { name: "file_path", nullable: true, length: 255 })
  filePath: string | null;

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

  @ManyToOne(() => ReportType, (reportType) => reportType.reports, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "report_type_id", referencedColumnName: "id" }])
  reportType: ReportType;

  @ManyToOne(() => Business, (business) => business.reports, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "business_id", referencedColumnName: "id" }])
  business: Business;

  @ManyToOne(() => Expert, (expert) => expert.reports, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "expert_id", referencedColumnName: "id" }])
  expert: Expert;

  @ManyToOne(() => Session, (session) => session.reports, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "session_id", referencedColumnName: "id" }])
  session: Session;
}
