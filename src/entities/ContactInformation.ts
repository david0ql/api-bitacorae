import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Business } from "./Business";
import { DocumentType } from "./DocumentType";
import { Gender } from "./Gender";
import { StrengtheningArea } from "./StrengtheningArea";
import { EducationLevel } from "./EducationLevel";

@Index("document_type_id", ["documentTypeId"], {})
@Index("gender_id", ["genderId"], {})
@Index("strengthing_area_id", ["strengtheningAreaId"], {})
@Index("education_level_id", ["educationLevelId"], {})
@Index("contact_information_ibfk_1", ["businessId"], {})
@Entity("contact_information", { schema: "dbbitacorae" })
export class ContactInformation {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "business_id" })
  businessId: number;

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

  @Column("varchar", { name: "document_number", nullable: true, length: 15 })
  documentNumber: string | null;

  @Column("varchar", { name: "photo", nullable: true, length: 255 })
  photo: string | null;

  @Column("int", { name: "gender_id", nullable: true })
  genderId: number | null;

  @Column("int", { name: "experience_years", nullable: true })
  experienceYears: number | null;

  @Column("int", { name: "strengthening_area_id", nullable: true })
  strengtheningAreaId: number | null;

  @Column("int", { name: "education_level_id", nullable: true })
  educationLevelId: number | null;

  @Column("varchar", {
    name: "facebook",
    nullable: true,
    length: 255,
    default: () => "''",
  })
  facebook: string | null;

  @Column("varchar", {
    name: "instagram",
    nullable: true,
    length: 255,
    default: () => "''",
  })
  instagram: string | null;

  @Column("varchar", {
    name: "twitter",
    nullable: true,
    length: 255,
    default: () => "''",
  })
  twitter: string | null;

  @Column("varchar", {
    name: "website",
    nullable: true,
    length: 255,
    default: () => "''",
  })
  website: string | null;

  @Column("varchar", {
    name: "linkedin",
    nullable: true,
    length: 255,
    default: () => "''",
  })
  linkedin: string | null;

  @Column("longtext", { name: "profile", nullable: true, default: () => "''" })
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

  @ManyToOne(() => Business, (business) => business.contactInformations, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "business_id", referencedColumnName: "id" }])
  business: Business;

  @ManyToOne(
    () => DocumentType,
    (documentType) => documentType.contactInformations,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "document_type_id", referencedColumnName: "id" }])
  documentType: DocumentType;

  @ManyToOne(() => Gender, (gender) => gender.contactInformations, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "gender_id", referencedColumnName: "id" }])
  gender: Gender;

  @ManyToOne(
    () => StrengtheningArea,
    (strengtheningArea) => strengtheningArea.contactInformations,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "strengthening_area_id", referencedColumnName: "id" }])
  strengtheningArea: StrengtheningArea;

  @ManyToOne(
    () => EducationLevel,
    (educationLevel) => educationLevel.contactInformations,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "education_level_id", referencedColumnName: "id" }])
  educationLevel: EducationLevel;
}
