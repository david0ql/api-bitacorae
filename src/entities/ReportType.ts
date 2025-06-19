import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Report } from "./Report";

@Entity("report_type")
export class ReportType {
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

  @OneToMany(() => Report, (report) => report.reportType)
  reports: Report[];
}
