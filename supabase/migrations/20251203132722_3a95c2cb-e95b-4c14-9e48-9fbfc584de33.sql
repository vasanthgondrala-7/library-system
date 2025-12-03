-- Fix search_path for functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_book_availability_on_borrow()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.books SET available_quantity = available_quantity - 1 WHERE id = NEW.book_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'borrowed' AND NEW.status = 'returned' THEN
    UPDATE public.books SET available_quantity = available_quantity + 1 WHERE id = NEW.book_id;
  END IF;
  RETURN NEW;
END;
$$;