import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Chat } from "./Chat";
import { User } from "./User";

@Index("chat_id", ["chatId"], {})
@Index("chat_message_user_fk", ["senderUserId"], {})
@Entity("chat_message", { schema: "dbbitacorae" })
export class ChatMessage {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "chat_id" })
  chatId: number;

  @Column("int", { name: "sender_user_id" })
  senderUserId: number;

  @Column("text", { name: "message" })
  message: string;

  @Column("timestamp", { name: "sent_at", default: () => "CURRENT_TIMESTAMP" })
  sentAt: Date;

  @ManyToOne(() => Chat, (chat) => chat.chatMessages, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "chat_id", referencedColumnName: "id" }])
  chat: Chat;

  @ManyToOne(() => User, (user) => user.chatMessages, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "sender_user_id", referencedColumnName: "id" }])
  senderUser: User;
}
