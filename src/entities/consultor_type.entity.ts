import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ExpertEntity } from "./expert.entity";

@Entity("consultor_type", { schema: "dbbitacorae" })
export class ConsultorTypeEntity {
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

  @OneToMany(() => ExpertEntity, (expertEntity) => expertEntity.consultorType)
  experts: ExpertEntity[];
}
