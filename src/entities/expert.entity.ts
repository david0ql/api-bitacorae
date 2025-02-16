import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";
import { DocumentTypeEntity } from "./document_type.entity";
import { ConsultorTypeEntity } from "./consultor_type.entity";
import { StrengthingAreaEntity } from "./strengthing_area.entity";
import { EducationLevelEntity } from "./education_level.entity";

@Index("user_id", ["userId"], {})
@Index("document_type_id", ["documentTypeId"], {})
@Index("consultor_type_id", ["consultorTypeId"], {})
@Index("strengthing_area_id", ["strengthingAreaId"], {})
@Index("education_level_id", ["educationLevelId"], {})
@Entity("expert", { schema: "dbbitacorae" })
export class ExpertEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "user_id" })
  userId: number;

  @Column("varchar", { name: "first_name", length: 255 })
  firstName: string;

  @Column("varchar", { name: "last_name", length: 255 })
  lastName: string;

  @Column("varchar", { name: "email", length: 255 })
  email: string;

  @Column("varchar", { name: "phone", nullable: true, length: 12 })
  phone: string | null;

  @Column("int", { name: "document_type_id", nullable: true })
  documentTypeId: number | null;

  @Column("varchar", { name: "document_number", nullable: true, length: 10 })
  documentNumber: string | null;

  @Column("varchar", { name: "photo", nullable: true, length: 255 })
  photo: string | null;

  @Column("int", { name: "consultor_type_id", nullable: true })
  consultorTypeId: number | null;

  @Column("int", { name: "gender_id", nullable: true })
  genderId: number | null;

  @Column("int", { name: "experience_years", nullable: true })
  experienceYears: number | null;

  @Column("int", { name: "strengthing_area_id", nullable: true })
  strengthingAreaId: number | null;

  @Column("int", { name: "education_level_id", nullable: true })
  educationLevelId: number | null;

  @Column("varchar", { name: "facebook", nullable: true, length: 255 })
  facebook: string | null;

  @Column("varchar", { name: "instagram", nullable: true, length: 255 })
  instagram: string | null;

  @Column("varchar", { name: "twitter", nullable: true, length: 255 })
  twitter: string | null;

  @Column("varchar", { name: "website", nullable: true, length: 255 })
  website: string | null;

  @Column("varchar", { name: "linkedin", nullable: true, length: 255 })
  linkedin: string | null;

  @Column("longtext", { name: "profile", nullable: true })
  profile: string | null;

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

  @ManyToOne(() => UserEntity, (userEntity) => userEntity.experts, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: UserEntity;

  @ManyToOne(
    () => DocumentTypeEntity,
    (documentTypeEntity) => documentTypeEntity.experts,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "document_type_id", referencedColumnName: "id" }])
  documentType: DocumentTypeEntity;

  @ManyToOne(
    () => ConsultorTypeEntity,
    (consultorTypeEntity) => consultorTypeEntity.experts,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "consultor_type_id", referencedColumnName: "id" }])
  consultorType: ConsultorTypeEntity;

  @ManyToOne(
    () => StrengthingAreaEntity,
    (strengthingAreaEntity) => strengthingAreaEntity.experts,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "strengthing_area_id", referencedColumnName: "id" }])
  strengthingArea: StrengthingAreaEntity;

  @ManyToOne(
    () => EducationLevelEntity,
    (educationLevelEntity) => educationLevelEntity.experts,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "education_level_id", referencedColumnName: "id" }])
  educationLevel: EducationLevelEntity;
}
