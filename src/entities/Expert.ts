import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Gender } from "./Gender";
import { User } from "./User";
import { DocumentType } from "./DocumentType";
import { ConsultorType } from "./ConsultorType";
import { StrengtheningArea } from "./StrengtheningArea";
import { EducationLevel } from "./EducationLevel";
import { Report } from "./Report";
import { Accompaniment } from "./Accompaniment";

@Index("user_id", ["userId"], {})
@Index("document_type_id", ["documentTypeId"], {})
@Index("consultor_type_id", ["consultorTypeId"], {})
@Index("strengthing_area_id", ["strengtheningAreaId"], {})
@Index("education_level_id", ["educationLevelId"], {})
@Index("expert_gender_FK", ["genderId"], {})
@Entity("expert", { schema: "dbbitacorae" })
export class Expert {
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

  @Column("varchar", { name: "phone", length: 12 })
  phone: string;

  @Column("int", { name: "document_type_id", default: () => "'1'" })
  documentTypeId: number;

  @Column("varchar", { name: "document_number", length: 10 })
  documentNumber: string;

  @Column("varchar", { name: "photo", nullable: true, length: 255 })
  photo: string | null;

  @Column("int", { name: "consultor_type_id", default: () => "'1'" })
  consultorTypeId: number;

  @Column("int", { name: "gender_id", default: () => "'1'" })
  genderId: number;

  @Column("int", { name: "experience_years", nullable: true })
  experienceYears: number | null;

  @Column("int", { name: "strengthening_area_id", default: () => "'1'" })
  strengtheningAreaId: number;

  @Column("int", { name: "education_level_id", default: () => "'1'" })
  educationLevelId: number;

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

  @ManyToOne(() => Gender, (gender) => gender.experts, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "gender_id", referencedColumnName: "id" }])
  gender: Gender;

  @ManyToOne(() => User, (user) => user.experts, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: User;

  @ManyToOne(() => DocumentType, (documentType) => documentType.experts, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "document_type_id", referencedColumnName: "id" }])
  documentType: DocumentType;

  @ManyToOne(() => ConsultorType, (consultorType) => consultorType.experts, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "consultor_type_id", referencedColumnName: "id" }])
  consultorType: ConsultorType;

  @ManyToOne(
    () => StrengtheningArea,
    (strengtheningArea) => strengtheningArea.experts,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "strengthening_area_id", referencedColumnName: "id" }])
  strengtheningArea: StrengtheningArea;

  @ManyToOne(() => EducationLevel, (educationLevel) => educationLevel.experts, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "education_level_id", referencedColumnName: "id" }])
  educationLevel: EducationLevel;

  @OneToMany(() => Report, (report) => report.expert)
  reports: Report[];

  @OneToMany(() => Accompaniment, (accompaniment) => accompaniment.expert)
  accompaniments: Accompaniment[];
}
