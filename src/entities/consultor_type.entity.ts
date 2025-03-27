import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ExpertEntity } from "./expert.entity";
import { RoleEntity } from "./role.entity";

@Index("role_id", ["roleId"], {})
@Entity("consultor_type", { schema: "dbbitacorae" })
export class ConsultorTypeEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "role_id" })
  roleId: number;

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

  @ManyToOne(() => RoleEntity, (roleEntity) => roleEntity.consultorTypes, {
	onDelete: "RESTRICT",
	onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "role_id", referencedColumnName: "id" }])
  role: RoleEntity;

  @OneToMany(() => ExpertEntity, (expertEntity) => expertEntity.consultorType)
  experts: ExpertEntity[];
}
