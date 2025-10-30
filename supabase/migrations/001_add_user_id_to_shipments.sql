-- Agregar columna user_id a la tabla shipments si no existe
ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Crear índice para mejorar el rendimiento de las consultas por user_id
CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON public.shipments(user_id);

-- Crear índice para consultas por order_id
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
