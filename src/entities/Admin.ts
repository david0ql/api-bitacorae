import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DocumentType } from "./DocumentType";
import { EducationLevel } from "./EducationLevel";
import { Gender } from "./Gender";
import { User } from "./User";
import { StrengtheningArea } from "./StrengtheningArea";

@Index("unique_user_id", ["userId"], { unique: true })
@Index("document_type_id", ["documentTypeId"], {})
@Index("gender_id", ["genderId"], {})
@Index("education_level_id", ["educationLevelId"], {})
@Entity("admin")
export class Admin {
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

  @ManyToOne(() => DocumentType, (documentType) => documentType.admins, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "document_type_id", referencedColumnName: "id" }])
  documentType: DocumentType;

  @ManyToOne(() => EducationLevel, (educationLevel) => educationLevel.admins, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "education_level_id", referencedColumnName: "id" }])
  educationLevel: EducationLevel;

  @ManyToOne(() => Gender, (gender) => gender.admins, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "gender_id", referencedColumnName: "id" }])
  gender: Gender;

  @OneToOne(() => User, (user) => user.admin, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: User;

  @ManyToMany(
    () => StrengtheningArea,
    (strengtheningArea) => strengtheningArea.admins
  )
  @JoinTable({
    name: "admin_strengthening_area_rel",
    joinColumns: [{ name: "admin_id", referencedColumnName: "id" }],
    inverseJoinColumns: [{ name: "strengthening_area_id", referencedColumnName: "id" }]
  })
  strengtheningAreas: StrengtheningArea[];
}
