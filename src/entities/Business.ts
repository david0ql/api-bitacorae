import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { EconomicActivity } from "./EconomicActivity";
import { StrengtheningArea } from "./StrengtheningArea";
import { Report } from "./Report";
import { ContactInformation } from "./ContactInformation";
import { Accompaniment } from "./Accompaniment";
import { User } from "./User";
import { DocumentType } from "./DocumentType";
import { BusinessSize } from "./BusinessSize";
import { Position } from "./Position";
import { ProductStatus } from "./ProductStatus";
import { MarketScope } from "./MarketScope";
import { Cohort } from "./Cohort";

@Index("user_id", ["userId"], {})
@Index("document_type_id", ["documentTypeId"], {})
@Index("business_size_id", ["businessSizeId"], {})
@Index("position_id", ["positionId"], {})
@Index("product_status_id", ["productStatusId"], {})
@Index("market_scope_id", ["marketScopeId"], {})
@Index("cohort_id", ["cohortId"], {})
@Entity("business", { schema: "dbbitacorae" })
export class Business {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "user_id" })
  userId: number;

  @Column("varchar", { name: "social_reason", length: 255 })
  socialReason: string;

  @Column("int", { name: "document_type_id" })
  documentTypeId: number;

  @Column("varchar", { name: "document_number", length: 15 })
  documentNumber: string;

  @Column("varchar", { name: "address", length: 255 })
  address: string;

  @Column("varchar", { name: "phone", length: 12 })
  phone: string;

  @Column("varchar", { name: "email", length: 255 })
  email: string;

  @Column("int", { name: "business_size_id" })
  businessSizeId: number;

  @Column("int", { name: "number_of_employees" })
  numberOfEmployees: number;

  @Column("double", { name: "last_year_sales", precision: 22 })
  lastYearSales: number;

  @Column("double", { name: "two_years_ago_sales", precision: 22 })
  twoYearsAgoSales: number;

  @Column("double", { name: "three_years_ago_sales", precision: 22 })
  threeYearsAgoSales: number;

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

  @Column("int", { name: "position_id" })
  positionId: number;

  @Column("tinyint", { name: "has_founded_before", nullable: true, width: 1 })
  hasFoundedBefore: boolean | null;

  @Column("longtext", { name: "observation", nullable: true })
  observation: string | null;

  @Column("int", { name: "number_of_people_leading" })
  numberOfPeopleLeading: number;

  @Column("int", { name: "product_status_id" })
  productStatusId: number;

  @Column("int", { name: "market_scope_id" })
  marketScopeId: number;

  @Column("longtext", { name: "business_plan", nullable: true })
  businessPlan: string | null;

  @Column("longtext", { name: "business_segmentation", nullable: true })
  businessSegmentation: string | null;

  @Column("int", { name: "assigned_hours" })
  assignedHours: number;

  @Column("int", { name: "cohort_id" })
  cohortId: number;

  @Column("longtext", { name: "diagnostic", nullable: true })
  diagnostic: string | null;

  @Column("text", { name: "evidence", nullable: true })
  evidence: string | null;

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

  @ManyToMany(
    () => EconomicActivity,
    (economicActivity) => economicActivity.businesses
  )
  @JoinTable({
    name: "business_economic_activity_rel",
    joinColumns: [{ name: "business_id", referencedColumnName: "id" }],
    inverseJoinColumns: [
      { name: "economic_activity_id", referencedColumnName: "id" },
    ],
    schema: "dbbitacorae",
  })
  economicActivities: EconomicActivity[];

  @ManyToMany(
    () => StrengtheningArea,
    (strengtheningArea) => strengtheningArea.businesses
  )
  @JoinTable({
    name: "business_strengthening_area_rel",
    joinColumns: [{ name: "business_id", referencedColumnName: "id" }],
    inverseJoinColumns: [
      { name: "strengthening_area_id", referencedColumnName: "id" },
    ],
    schema: "dbbitacorae",
  })
  strengtheningAreas: StrengtheningArea[];

  @OneToMany(() => Report, (report) => report.business)
  reports: Report[];

  @OneToMany(
    () => ContactInformation,
    (contactInformation) => contactInformation.business
  )
  contactInformations: ContactInformation[];

  @OneToMany(() => Accompaniment, (accompaniment) => accompaniment.business)
  accompaniments: Accompaniment[];

  @ManyToOne(() => User, (user) => user.businesses, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: User;

  @ManyToOne(() => DocumentType, (documentType) => documentType.businesses, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "document_type_id", referencedColumnName: "id" }])
  documentType: DocumentType;

  @ManyToOne(() => BusinessSize, (businessSize) => businessSize.businesses, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "business_size_id", referencedColumnName: "id" }])
  businessSize: BusinessSize;

  @ManyToOne(() => Position, (position) => position.businesses, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "position_id", referencedColumnName: "id" }])
  position: Position;

  @ManyToOne(() => ProductStatus, (productStatus) => productStatus.businesses, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "product_status_id", referencedColumnName: "id" }])
  productStatus: ProductStatus;

  @ManyToOne(() => MarketScope, (marketScope) => marketScope.businesses, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "market_scope_id", referencedColumnName: "id" }])
  marketScope: MarketScope;

  @ManyToOne(() => Cohort, (cohort) => cohort.businesses, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "cohort_id", referencedColumnName: "id" }])
  cohort: Cohort;
}
