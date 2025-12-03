-- Books table
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT UNIQUE NOT NULL,
  genre TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  available_quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Members table
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  membership_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Borrowings table
CREATE TABLE public.borrowings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  return_date DATE,
  late_fee DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrowings ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (for demo purposes - no auth required)
CREATE POLICY "Allow all operations on books" ON public.books FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on members" ON public.members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on borrowings" ON public.borrowings FOR ALL USING (true) WITH CHECK (true);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_borrowings_updated_at BEFORE UPDATE ON public.borrowings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update book availability when borrowed
CREATE OR REPLACE FUNCTION public.update_book_availability_on_borrow()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.books SET available_quantity = available_quantity - 1 WHERE id = NEW.book_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'borrowed' AND NEW.status = 'returned' THEN
    UPDATE public.books SET available_quantity = available_quantity + 1 WHERE id = NEW.book_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_book_availability AFTER INSERT OR UPDATE ON public.borrowings FOR EACH ROW EXECUTE FUNCTION public.update_book_availability_on_borrow();