-- CreateEnum
CREATE TYPE "TextLanguage" AS ENUM ('FRENCH_ARABIC', 'ARABIC_ONLY', 'FRENCH_ONLY');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ANIMATEUR';

-- CreateTable
CREATE TABLE "tshirt_templates" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "image_url" VARCHAR(500) NOT NULL,
    "base_price" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tshirt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_number" VARCHAR(50) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "total_amount" DECIMAL(10,2) NOT NULL,
    "hotel_name" VARCHAR(255),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_order_items" (
    "id" BIGSERIAL NOT NULL,
    "custom_order_id" UUID NOT NULL,
    "template_id" BIGINT NOT NULL,
    "size" "TShirtSize" NOT NULL,
    "printed_name" VARCHAR(255) NOT NULL,
    "text_language" "TextLanguage" NOT NULL,
    "with_djerba_logo" BOOLEAN NOT NULL DEFAULT false,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "custom_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tshirt_templates_code_key" ON "tshirt_templates"("code");

-- CreateIndex
CREATE UNIQUE INDEX "custom_orders_order_number_key" ON "custom_orders"("order_number");

-- AddForeignKey
ALTER TABLE "custom_orders" ADD CONSTRAINT "custom_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_order_items" ADD CONSTRAINT "custom_order_items_custom_order_id_fkey" FOREIGN KEY ("custom_order_id") REFERENCES "custom_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_order_items" ADD CONSTRAINT "custom_order_items_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "tshirt_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
