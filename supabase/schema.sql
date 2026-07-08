-- ============================================================
-- 棚卸し在庫管理アプリ: Supabase スキーマ定義
-- Supabase Dashboard > SQL Editor で実行してください。
-- ============================================================

-- ------------------------------------------------------------
-- products（商品マスタ）
-- ------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  management_code text,
  category text,
  purchase_price integer not null default 0,
  selling_price integer not null default 0,
  stock_quantity integer not null default 0,
  location text,
  supplier text,
  image_url text,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_user_id_idx on public.products(user_id);
create index if not exists products_management_code_idx on public.products(management_code);

-- updated_at 自動更新
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- stocktakes（棚卸しセッション）
-- ------------------------------------------------------------
create table if not exists public.stocktakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists stocktakes_user_id_idx on public.stocktakes(user_id);

-- ------------------------------------------------------------
-- stocktake_items（棚卸し明細）
-- ------------------------------------------------------------
create table if not exists public.stocktake_items (
  id uuid primary key default gen_random_uuid(),
  stocktake_id uuid not null references public.stocktakes(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  book_quantity integer not null default 0,
  actual_quantity integer,
  counted boolean not null default false,
  difference integer generated always as (coalesce(actual_quantity, 0) - book_quantity) stored
);

create index if not exists stocktake_items_stocktake_id_idx on public.stocktake_items(stocktake_id);
create unique index if not exists stocktake_items_unique_product
  on public.stocktake_items(stocktake_id, product_id);

-- ------------------------------------------------------------
-- stock_movements（在庫変動履歴・P2）
-- ------------------------------------------------------------
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  type text not null check (type in ('purchase', 'sale', 'adjustment')),
  quantity_change integer not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_user_id_idx on public.stock_movements(user_id);
create index if not exists stock_movements_product_id_idx on public.stock_movements(product_id);

-- ------------------------------------------------------------
-- RLS（本人データのみアクセス可）
-- ------------------------------------------------------------
alter table public.products enable row level security;
alter table public.stocktakes enable row level security;
alter table public.stocktake_items enable row level security;
alter table public.stock_movements enable row level security;

-- products
drop policy if exists "products_select_own" on public.products;
drop policy if exists "products_insert_own" on public.products;
drop policy if exists "products_update_own" on public.products;
drop policy if exists "products_delete_own" on public.products;

create policy "products_select_own" on public.products
  for select using (auth.uid() = user_id);
create policy "products_insert_own" on public.products
  for insert with check (auth.uid() = user_id);
create policy "products_update_own" on public.products
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "products_delete_own" on public.products
  for delete using (auth.uid() = user_id);

-- stocktakes
drop policy if exists "stocktakes_select_own" on public.stocktakes;
drop policy if exists "stocktakes_insert_own" on public.stocktakes;
drop policy if exists "stocktakes_update_own" on public.stocktakes;
drop policy if exists "stocktakes_delete_own" on public.stocktakes;

create policy "stocktakes_select_own" on public.stocktakes
  for select using (auth.uid() = user_id);
create policy "stocktakes_insert_own" on public.stocktakes
  for insert with check (auth.uid() = user_id);
create policy "stocktakes_update_own" on public.stocktakes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "stocktakes_delete_own" on public.stocktakes
  for delete using (auth.uid() = user_id);

-- stocktake_items（stocktakes.user_id を経由して判定）
drop policy if exists "stocktake_items_select_own" on public.stocktake_items;
drop policy if exists "stocktake_items_insert_own" on public.stocktake_items;
drop policy if exists "stocktake_items_update_own" on public.stocktake_items;
drop policy if exists "stocktake_items_delete_own" on public.stocktake_items;

create policy "stocktake_items_select_own" on public.stocktake_items
  for select using (
    exists (select 1 from public.stocktakes st where st.id = stocktake_id and st.user_id = auth.uid())
  );
create policy "stocktake_items_insert_own" on public.stocktake_items
  for insert with check (
    exists (select 1 from public.stocktakes st where st.id = stocktake_id and st.user_id = auth.uid())
  );
create policy "stocktake_items_update_own" on public.stocktake_items
  for update using (
    exists (select 1 from public.stocktakes st where st.id = stocktake_id and st.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.stocktakes st where st.id = stocktake_id and st.user_id = auth.uid())
  );
create policy "stocktake_items_delete_own" on public.stocktake_items
  for delete using (
    exists (select 1 from public.stocktakes st where st.id = stocktake_id and st.user_id = auth.uid())
  );

-- stock_movements
drop policy if exists "stock_movements_select_own" on public.stock_movements;
drop policy if exists "stock_movements_insert_own" on public.stock_movements;
drop policy if exists "stock_movements_update_own" on public.stock_movements;
drop policy if exists "stock_movements_delete_own" on public.stock_movements;

create policy "stock_movements_select_own" on public.stock_movements
  for select using (auth.uid() = user_id);
create policy "stock_movements_insert_own" on public.stock_movements
  for insert with check (auth.uid() = user_id);
create policy "stock_movements_update_own" on public.stock_movements
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "stock_movements_delete_own" on public.stock_movements
  for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Storage: 商品画像用バケット（パスは "<user_id>/<ファイル名>" 前提）
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
drop policy if exists "product_images_owner_insert" on storage.objects;
drop policy if exists "product_images_owner_update" on storage.objects;
drop policy if exists "product_images_owner_delete" on storage.objects;

create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "product_images_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'product-images' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "product_images_owner_update" on storage.objects
  for update using (
    bucket_id = 'product-images' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "product_images_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'product-images' and auth.uid()::text = (storage.foldername(name))[1]
  );
