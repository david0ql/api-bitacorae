import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("platform", { schema: "dbbitacorae" })
export class Platform {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "operator_name", length: 255 })
  operatorName: string;

  @Column("varchar", { name: "logo_path", nullable: true, length: 500 })
  logoPath: string | null;

  @Column("varchar", {
    name: "report_header_image_path",
    nullable: true,
    length: 500,
  })
  reportHeaderImagePath: string | null;

  @Column("varchar", { name: "website", nullable: true, length: 255 })
  website: string | null;

  @Column("varchar", { name: "program_name", nullable: true, length: 500 })
  programName: string | null;

  @Column("varchar", {
    name: "notification_email",
    nullable: true,
    length: 255,
  })
  notificationEmail: string | null;

  @Column("date", { name: "program_start_date", nullable: true })
  programStartDate: string | null;

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
}
