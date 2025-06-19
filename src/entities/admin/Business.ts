import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("business", { schema: "dbbitacorae_admin" })
export class Business {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "username", length: 30 })
  username: string;

  @Column("varchar", { name: "password", length: 255 })
  password: string;

  @Column("varchar", { name: "name", length: 25 })
  name: string;

  @Column("varchar", { name: "host", length: 25 })
  host: string;

  @Column("int", { name: "port" })
  port: number;

  @Column("varchar", { name: "db_name", length: 25 })
  dbName: string;

  @Column("timestamp", {
    name: "created_at",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @Column("timestamp", {
    name: "updated_At",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;
} 