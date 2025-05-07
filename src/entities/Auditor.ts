import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DocumentType } from "./DocumentType";
import { EducationLevel } from "./EducationLevel";
import { Gender } from "./Gender";
import { StrengtheningArea } from "./StrengtheningArea";
import { User } from "./User";

@Index("unique_user_id", ["userId"], { unique: true })
@Index("document_type_id", ["documentTypeId"], {})
@Index("gender_id", ["genderId"], {})
@Index("education_level_id", ["educationLevelId"], {})
@Index("strengthening_area_id", ["strengtheningAreaId"], {})
@Entity("auditor", { schema: "dbbitacorae" })
export class Auditor {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "user_id", unique: true })
  userId: number;

  @Column("varchar", { name: "first_name", length: 255 })
  firstName: string;

  @Column("varchar", { name: "last_name", nullable: true, length: 255 })
  lastName: string | null;

  @Column("int", { name: "document_type_id", nullable: true })
  documentTypeId: number | null;

  @Column("varchar", { name: "document_number", nullable: true, length: 20 })
  documentNumber: string | null;

  @Column("varchar", { name: "phone", nullable: true, length: 20 })
  phone: string | null;

  @Column("int", { name: "gender_id", nullable: true })
  genderId: number | null;

  @Column("varchar", { name: "photo", nullable: true, length: 255 })
  photo: string | null;

  @Column("int", { name: "education_level_id", nullable: true })
  educationLevelId: number | null;

  @Column("int", { name: "experience_years", nullable: true })
  experienceYears: number | null;

  @Column("int", { name: "strengthening_area_id", nullable: true })
  strengtheningAreaId: number | null;

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

  @ManyToOne(() => DocumentType, (documentType) => documentType.auditors, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "document_type_id", referencedColumnName: "id" }])
  documentType: DocumentType;

  @ManyToOne(
    () => EducationLevel,
    (educationLevel) => educationLevel.auditors,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "education_level_id", referencedColumnName: "id" }])
  educationLevel: EducationLevel;

  @ManyToOne(() => Gender, (gender) => gender.auditors, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "gender_id", referencedColumnName: "id" }])
  gender: Gender;

  @ManyToOne(
    () => StrengtheningArea,
    (strengtheningArea) => strengtheningArea.auditors,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "strengthening_area_id", referencedColumnName: "id" }])
  strengtheningArea: StrengtheningArea;

  @OneToOne(() => User, (user) => user.auditor, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: User;
}
