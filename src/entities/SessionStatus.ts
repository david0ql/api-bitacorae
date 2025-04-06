import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Session } from "./Session";

@Entity("session_status", { schema: "dbbitacorae" })
export class SessionStatus {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "name", length: 50 })
  name: string;

  @Column("timestamp", {
    name: "created_at",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @OneToMany(() => Session, (session) => session.status)
  sessions: Session[];
}
