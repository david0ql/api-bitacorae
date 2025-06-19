import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Accompaniment } from "./Accompaniment";
import { SessionStatus } from "./SessionStatus";
import { SessionActivity } from "./SessionActivity";
import { SessionAttachment } from "./SessionAttachment";
import { Report } from "./Report";
import { SessionPreparationFile } from "./SessionPreparationFile";
import { Chat } from "./Chat";

@Index("session_status_id", ["statusId"], {})
@Entity("session")
export class Session {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "accompaniment_id" })
  accompanimentId: number;

  @Column("varchar", { name: "title", length: 255 })
  title: string;

  @Column("datetime", { name: "start_datetime" })
  startDatetime: Date;

  @Column("datetime", { name: "end_datetime" })
  endDatetime: Date;

  @Column("varchar", { name: "conference_link", nullable: true, length: 255 })
  conferenceLink: string | null;

  @Column("longtext", { name: "preparation_notes", nullable: true })
  preparationNotes: string | null;

  @Column("longtext", { name: "session_notes", nullable: true })
  sessionNotes: string | null;

  @Column("longtext", { name: "conclusions_commitments", nullable: true })
  conclusionsCommitments: string | null;

  @Column("int", { name: "status_id", default: () => "'1'" })
  statusId: number;

  @Column("varchar", {
    name: "file_path_unapproved",
    nullable: true,
    length: 500,
  })
  filePathUnapproved: string | null;

  @Column("varchar", {
    name: "file_path_approved",
    nullable: true,
    length: 500,
  })
  filePathApproved: string | null;

  @Column("datetime", { name: "file_generation_datetime", nullable: true })
  fileGenerationDatetime: Date | null;

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

  @ManyToOne(() => Accompaniment, (accompaniment) => accompaniment.sessions, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "accompaniment_id", referencedColumnName: "id" }])
  accompaniment: Accompaniment;

  @ManyToOne(() => SessionStatus, (sessionStatus) => sessionStatus.sessions, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "status_id", referencedColumnName: "id" }])
  status: SessionStatus;

  @OneToMany(
    () => SessionActivity,
    (sessionActivity) => sessionActivity.session
  )
  sessionActivities: SessionActivity[];

  @OneToMany(
    () => SessionAttachment,
    (sessionAttachment) => sessionAttachment.session
  )
  sessionAttachments: SessionAttachment[];

  @OneToMany(() => Report, (report) => report.session)
  reports: Report[];

  @OneToMany(
    () => SessionPreparationFile,
    (sessionPreparationFile) => sessionPreparationFile.session
  )
  sessionPreparationFiles: SessionPreparationFile[];

  @OneToOne(() => Chat, (chat) => chat.session)
  chat: Chat;
}
