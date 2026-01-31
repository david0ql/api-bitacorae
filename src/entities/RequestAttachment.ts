import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("request_type_request_id", ["requestType", "requestId"], {})
@Index("legacy_source_legacy_id", ["legacySource", "legacyId"], { unique: true })
@Entity("request_attachment")
export class RequestAttachment {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "request_type", length: 50 })
  requestType: string;

  @Column("int", { name: "request_id" })
  requestId: number;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

  @Column("text", { name: "file_path", nullable: true })
  filePath: string | null;

  @Column("text", { name: "external_path", nullable: true })
  externalPath: string | null;

  @Column("varchar", { name: "legacy_source", nullable: true, length: 50 })
  legacySource: string | null;

  @Column("int", { name: "legacy_id", nullable: true })
  legacyId: number | null;

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
