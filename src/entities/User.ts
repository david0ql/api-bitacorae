import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SessionActivity } from "./SessionActivity";
import { Expert } from "./Expert";
import { Role } from "./Role";
import { SessionActivityResponse } from "./SessionActivityResponse";
import { ChatMessage } from "./ChatMessage";
import { Business } from "./Business";

@Index("email_unique", ["email"], { unique: true })
@Index("role_id", ["roleId"], {})
@Entity("user", { schema: "dbbitacorae" })
export class User {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "role_id" })
  roleId: number;

  @Column("int", { name: "active", default: () => "'1'" })
  active: number;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

  @Column("varchar", { name: "email", unique: true, length: 255 })
  email: string;

  @Column("varchar", { name: "password", length: 255 })
  password: string;

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

  @OneToMany(
    () => SessionActivity,
    (sessionActivity) => sessionActivity.createdByUser
  )
  sessionActivities: SessionActivity[];

  @OneToMany(() => Expert, (expert) => expert.user)
  experts: Expert[];

  @ManyToOne(() => Role, (role) => role.users, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "role_id", referencedColumnName: "id" }])
  role: Role;

  @OneToMany(
    () => SessionActivityResponse,
    (sessionActivityResponse) => sessionActivityResponse.respondedByUser
  )
  sessionActivityResponses: SessionActivityResponse[];

  @OneToMany(() => ChatMessage, (chatMessage) => chatMessage.senderUser)
  chatMessages: ChatMessage[];

  @OneToMany(() => Business, (business) => business.user)
  businesses: Business[];
}
