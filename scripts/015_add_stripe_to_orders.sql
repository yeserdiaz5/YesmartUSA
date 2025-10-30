-- Add Stripe payment intent ID to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent 
ON orders(stripe_payment_intent_id);
