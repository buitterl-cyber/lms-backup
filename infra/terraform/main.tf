# RiyadaIntel infrastructure (AWS, multi-region for data residency). Skeleton — wire backend +
# real module sources before apply. Each region (eu/me/africa/asia) is a workspace so tenant data
# stays in-region. See docs/01 §22–23.

terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  # backend "s3" { bucket = "riyada-tfstate"; key = "infra.tfstate"; dynamodb_table = "riyada-tflock" }
}

variable "region" { default = "eu-west-1" }
variable "environment" { default = "staging" }
variable "data_residency" {
  description = "eu | me | africa | asia"
  default     = "eu"
}

provider "aws" {
  region = var.region
  default_tags { tags = { Project = "riyadaintel", Env = var.environment, Residency = var.data_residency } }
}

module "network" {
  source = "./modules/network" # VPC, subnets, NAT, security groups
  name   = "riyada-${var.environment}"
}

module "eks" {
  source       = "./modules/eks" # EKS cluster + node groups (api/web/workers), IRSA, KEDA
  cluster_name = "riyada-${var.environment}"
  vpc_id       = module.network.vpc_id
  subnet_ids   = module.network.private_subnet_ids
}

module "data" {
  source = "./modules/data" # Aurora Postgres (multi-AZ + PITR), ElastiCache Redis, Amazon MQ
  name   = "riyada-${var.environment}"
  vpc_id = module.network.vpc_id
}

module "storage" {
  source = "./modules/storage" # S3 buckets (content, certificates, generated assets) + KMS
  name   = "riyada-${var.environment}"
}

# ClickHouse Cloud + Meilisearch are managed services (provider blocks omitted in skeleton).

output "cluster_endpoint" { value = module.eks.cluster_endpoint }
output "db_endpoint" { value = module.data.db_endpoint, sensitive = true }
