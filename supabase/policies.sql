-- Habilita RLS en la tabla (ajusta el esquema/nombre si difiere)
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- 1) Permitir INSERT público (usuarios anónimos) para poder crear etiquetas sin login
--    Úsalo solo si realmente quieres permitir inserts sin sesión desde el cliente.
CREATE POLICY "Public can insert shipments"
ON public.shipments
FOR INSERT
TO anon
USING (true)
WITH CHECK (true);

-- 2) Limitar SELECT a cada dueño (autenticado) según la columna user_id
--    Asegúrate de que public.shipments tenga la columna user_id (uuid) que corresponda a auth.uid()
CREATE POLICY "Owner can select own shipments"
ON public.shipments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- (Opcional) Si quieres permitir UPDATE y DELETE solo al dueño, puedes activar estas políticas:
-- CREATE POLICY "Owner can update own shipments"
-- ON public.shipments
-- FOR UPDATE
-- TO authenticated
-- USING (user_id = auth.uid())
-- WITH CHECK (user_id = auth.uid());

-- CREATE POLICY "Owner can delete own shipments"
-- ON public.shipments
-- FOR DELETE
-- TO authenticated
-- USING (user_id = auth.uid());
