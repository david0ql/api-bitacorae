import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SessionActivity } from "./SessionActivity";
import { User } from "./User";

@Index("activity_id", ["sessionActivityId"], {})
@Index("responded_by_user_id", ["respondedByUserId"], {})
@Entity("session_activity_response", { schema: "dbbitacorae" })
export class SessionActivityResponse {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "session_activity_id" })
  sessionActivityId: number;

  @Column("int", { name: "responded_by_user_id" })
  respondedByUserId: number;

  @Column("text", { name: "deliverable_description", nullable: true })
  deliverableDescription: string | null;

  @Column("varchar", {
    name: "deliverable_file_path",
    nullable: true,
    length: 255,
  })
  deliverableFilePath: string | null;

  @Column("datetime", {
    name: "responded_datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  respondedDatetime: Date;

  @Column("int", { name: "grade", nullable: true })
  grade: number | null;

  @Column("datetime", { name: "graded_datetime", nullable: true })
  gradedDatetime: Date | null;

  @ManyToOne(
    () => SessionActivity,
    (sessionActivity) => sessionActivity.sessionActivityResponses,
    { onDelete: "CASCADE", onUpdate: "CASCADE" }
  )
  @JoinColumn([{ name: "session_activity_id", referencedColumnName: "id" }])
  sessionActivity: SessionActivity;

  @ManyToOne(() => User, (user) => user.sessionActivityResponses, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "responded_by_user_id", referencedColumnName: "id" }])
  respondedByUser: User;
}
