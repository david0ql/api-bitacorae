import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Session } from "./Session";

@Index("session_id", ["sessionId"], {})
@Entity("session_attachment", { schema: "dbbitacorae" })
export class SessionAttachment {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "session_id" })
  sessionId: number;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

  @Column("text", { name: "file_path", nullable: true })
  filePath: string | null;

  @Column("text", { name: "external_path", nullable: true })
  externalPath: string | null;

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

  @ManyToOne(() => Session, (session) => session.sessionAttachments, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "session_id", referencedColumnName: "id" }])
  session: Session;
}
