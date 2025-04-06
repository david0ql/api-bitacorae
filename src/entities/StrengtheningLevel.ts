import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Service } from "./Service";
import { StrengtheningArea } from "./StrengtheningArea";

@Entity("strengthening_level", { schema: "dbbitacorae" })
export class StrengtheningLevel {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

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

  @OneToMany(() => Service, (service) => service.level)
  services: Service[];

  @OneToMany(
    () => StrengtheningArea,
    (strengtheningArea) => strengtheningArea.level
  )
  strengtheningAreas: StrengtheningArea[];
}
