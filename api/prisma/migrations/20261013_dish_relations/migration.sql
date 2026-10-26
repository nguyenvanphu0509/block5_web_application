BEGIN;
ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS "priceIsDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS "recipeIsDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS "chefId" INTEGER;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS "catalogKey" TEXT;
ALTER TABLE public.chefs ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.chefs ADD COLUMN IF NOT EXISTS "catalogKey" TEXT;
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS "catalogKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "restaurants_catalogKey_key" ON public.restaurants("catalogKey");
CREATE UNIQUE INDEX IF NOT EXISTS "chefs_catalogKey_key" ON public.chefs("catalogKey");
CREATE UNIQUE INDEX IF NOT EXISTS "ingredients_catalogKey_key" ON public.ingredients("catalogKey");
CREATE INDEX IF NOT EXISTS "dishes_chefId_idx" ON public.dishes("chefId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='dishes_chefId_fkey' AND conrelid='public.dishes'::regclass) THEN
    ALTER TABLE public.dishes ADD CONSTRAINT "dishes_chefId_fkey" FOREIGN KEY ("chefId") REFERENCES public.chefs(id) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.dish_ingredients (
  "dishId" INTEGER NOT NULL,
  "ingredientId" INTEGER NOT NULL,
  CONSTRAINT "dish_ingredients_pkey" PRIMARY KEY ("dishId", "ingredientId"),
  CONSTRAINT "dish_ingredients_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES public.dishes(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "dish_ingredients_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES public.ingredients(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "dish_ingredients_ingredientId_idx" ON public.dish_ingredients("ingredientId");
ALTER TABLE public.dish_ingredients ENABLE ROW LEVEL SECURITY;
COMMIT;
