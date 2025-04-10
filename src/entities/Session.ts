import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Accompaniment } from "./Accompaniment";
import { SessionStatus } from "./SessionStatus";
import { SessionPreparationFile } from "./SessionPreparationFile";

@Index("accompaniment_id", ["accompanimentId"], {})
@Index("session_session_status_FK", ["statusId"], {})
@Entity("session", { schema: "dbbitacorae" })
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

  @Column("int", { name: "status_id", default: () => "'1'" })
  statusId: number;

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
    () => SessionPreparationFile,
    (sessionPreparationFile) => sessionPreparationFile.session
  )
  sessionPreparationFiles: SessionPreparationFile[];
}
