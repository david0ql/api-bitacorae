import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Session } from "./Session";
import { User } from "./User";
import { SessionActivityResponse } from "./SessionActivityResponse";

@Index("session_id", ["sessionId"], {})
@Index("created_by_user_id", ["createdByUserId"], {})
@Entity("session_activity")
export class SessionActivity {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "session_id" })
  sessionId: number;

  @Column("int", { name: "created_by_user_id" })
  createdByUserId: number;

  @Column("varchar", { name: "title", length: 255 })
  title: string;

  @Column("text", { name: "description" })
  description: string;

  @Column("tinyint", {
    name: "requires_deliverable",
    width: 1,
    default: () => "'0'",
  })
  requiresDeliverable: boolean;

  @Column("datetime", { name: "due_datetime" })
  dueDatetime: Date;

  @Column("varchar", { name: "attachment_path", nullable: true, length: 255 })
  attachmentPath: string | null;

  @Column("timestamp", {
    name: "created_at",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @ManyToOne(() => Session, (session) => session.sessionActivities, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "session_id", referencedColumnName: "id" }])
  session: Session;

  @ManyToOne(() => User, (user) => user.sessionActivities, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "created_by_user_id", referencedColumnName: "id" }])
  createdByUser: User;

  @OneToMany(
    () => SessionActivityResponse,
    (sessionActivityResponse) => sessionActivityResponse.sessionActivity
  )
  sessionActivityResponses: SessionActivityResponse[];
}
