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
@Entity("session_preparation_file")
export class SessionPreparationFile {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "session_id" })
  sessionId: number;

  @Column("varchar", { name: "file_path", length: 500 })
  filePath: string;

  @Column("timestamp", {
    name: "created_at",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @ManyToOne(() => Session, (session) => session.sessionPreparationFiles, {
    onDelete: "CASCADE",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "session_id", referencedColumnName: "id" }])
  session: Session;
}
