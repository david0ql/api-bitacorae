import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ChatMessage } from "./ChatMessage";
import { Session } from "./Session";

@Index("unique_session_chat", ["sessionId"], { unique: true })
@Entity("chat")
export class Chat {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "session_id", unique: true })
  sessionId: number;

  @Column("timestamp", {
    name: "created_at",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @OneToMany(() => ChatMessage, (chatMessage) => chatMessage.chat)
  chatMessages: ChatMessage[];

  @OneToOne(() => Session, (session) => session.chat, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "session_id", referencedColumnName: "id" }])
  session: Session;
}
