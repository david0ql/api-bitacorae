import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ContactInformationEntity } from "./contact_information.entity";
import { UserEntity } from "./user.entity";
import { DocumentTypeEntity } from "./document_type.entity";
import { EconomicActivityEntity } from "./economic_activity.entity";
import { BusinessSizeEntity } from "./business_size.entity";
import { PositionEntity } from "./position.entity";
import { ProductStatusEntity } from "./product_status.entity";
import { MarketScopeEntity } from "./market_scope.entity";
import { StrengtheningAreaEntity } from "./strengthening_area.entity";
import { CohortEntity } from "./cohort.entity";

@Index("user_id", ["userId"], {})
@Index("document_type_id", ["documentTypeId"], {})
@Index("economic_activity_id", ["economicActivityId"], {})
@Index("business_size_id", ["businessSizeId"], {})
@Index("position_id", ["positionId"], {})
@Index("product_status_id", ["productStatusId"], {})
@Index("market_scope_id", ["marketScopeId"], {})
@Index("strengthening_area_id", ["strengtheningAreaId"], {})
@Index("cohort_id", ["cohortId"], {})
@Entity("business", { schema: "dbbitacorae" })
export class BusinessEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "user_id" })
  userId: number;

  @Column("varchar", { name: "social_reason", length: 255 })
  socialReason: string;

  @Column("int", { name: "document_type_id" })
  documentTypeId: number;

  @Column("varchar", { name: "document_number", length: 10 })
  documentNumber: string;

  @Column("varchar", { name: "address", length: 255 })
  address: string;

  @Column("varchar", { name: "phone", length: 12 })
  phone: string;

  @Column("varchar", { name: "email", length: 255 })
  email: string;

  @Column("int", { name: "economic_activity_id" })
  economicActivityId: number;

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

  @Column("int", { name: "strengthening_area_id" })
  strengtheningAreaId: number;

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

  @OneToMany(
    () => ContactInformationEntity,
    (contactInformationEntity) => contactInformationEntity.business
  )
  contactInformations: ContactInformationEntity[];

  @ManyToOne(() => UserEntity, (userEntity) => userEntity.businesses, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: UserEntity;

  @ManyToOne(
    () => DocumentTypeEntity,
    (documentTypeEntity) => documentTypeEntity.businesses,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "document_type_id", referencedColumnName: "id" }])
  documentType: DocumentTypeEntity;

  @ManyToOne(
    () => EconomicActivityEntity,
    (economicActivityEntity) => economicActivityEntity.businesses,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "economic_activity_id", referencedColumnName: "id" }])
  economicActivity: EconomicActivityEntity;

  @ManyToOne(
    () => BusinessSizeEntity,
    (businessSizeEntity) => businessSizeEntity.businesses,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "business_size_id", referencedColumnName: "id" }])
  businessSize: BusinessSizeEntity;

  @ManyToOne(
    () => PositionEntity,
    (positionEntity) => positionEntity.businesses,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "position_id", referencedColumnName: "id" }])
  position: PositionEntity;

  @ManyToOne(
    () => ProductStatusEntity,
    (productStatusEntity) => productStatusEntity.businesses,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "product_status_id", referencedColumnName: "id" }])
  productStatus: ProductStatusEntity;

  @ManyToOne(
    () => MarketScopeEntity,
    (marketScopeEntity) => marketScopeEntity.businesses,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "market_scope_id", referencedColumnName: "id" }])
  marketScope: MarketScopeEntity;

  @ManyToOne(
    () => StrengtheningAreaEntity,
    (strengtheningAreaEntity) => strengtheningAreaEntity.businesses,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "strengthening_area_id", referencedColumnName: "id" }])
  strengtheningArea: StrengtheningAreaEntity;

  @ManyToOne(() => CohortEntity, (cohortEntity) => cohortEntity.businesses, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "cohort_id", referencedColumnName: "id" }])
  cohort: CohortEntity;
}
