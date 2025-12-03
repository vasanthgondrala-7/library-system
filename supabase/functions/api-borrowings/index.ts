import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const action = url.searchParams.get('action'); // 'return' for returning a book

    console.log(`[api-borrowings] ${req.method} request`, { id, action });

    // GET - List all borrowings or get single borrowing
    if (req.method === 'GET') {
      if (id) {
        const { data, error } = await supabase
          .from('borrowings')
          .select('*, books(*), members(*)')
          .eq('id', id)
          .maybeSingle();
        
        if (error) throw error;
        if (!data) {
          return new Response(JSON.stringify({ error: 'Borrowing not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('borrowings')
        .select('*, books(*), members(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST - Create new borrowing (borrow a book)
    if (req.method === 'POST') {
      const body = await req.json();
      const { book_id, member_id, due_date } = body;

      if (!book_id || !member_id || !due_date) {
        return new Response(JSON.stringify({ error: 'book_id, member_id, and due_date are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check book availability
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('available_quantity')
        .eq('id', book_id)
        .single();

      if (bookError) throw bookError;
      if (book.available_quantity < 1) {
        return new Response(JSON.stringify({ error: 'Book is not available' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('borrowings')
        .insert({ book_id, member_id, due_date, status: 'borrowed' })
        .select('*, books(*), members(*)')
        .single();
      
      if (error) throw error;
      console.log('[api-borrowings] Borrowing created:', data.id);
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT - Update borrowing (including return action)
    if (req.method === 'PUT') {
      if (!id) {
        return new Response(JSON.stringify({ error: 'id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Handle return action
      if (action === 'return') {
        const today = new Date().toISOString().split('T')[0];
        
        // Get borrowing to calculate late fee
        const { data: borrowing, error: fetchError } = await supabase
          .from('borrowings')
          .select('due_date')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        let lateFee = 0;
        const dueDate = new Date(borrowing.due_date);
        const returnDate = new Date(today);
        if (returnDate > dueDate) {
          const daysLate = Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          lateFee = daysLate * 1; // $1 per day late
        }

        const { data, error } = await supabase
          .from('borrowings')
          .update({ status: 'returned', return_date: today, late_fee: lateFee })
          .eq('id', id)
          .select('*, books(*), members(*)')
          .single();
        
        if (error) throw error;
        console.log('[api-borrowings] Book returned:', id, { lateFee });
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Regular update
      const body = await req.json();
      const { data, error } = await supabase
        .from('borrowings')
        .update(body)
        .eq('id', id)
        .select('*, books(*), members(*)')
        .single();
      
      if (error) throw error;
      console.log('[api-borrowings] Borrowing updated:', id);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE - Delete borrowing
    if (req.method === 'DELETE') {
      if (!id) {
        return new Response(JSON.stringify({ error: 'id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase.from('borrowings').delete().eq('id', id);
      if (error) throw error;
      console.log('[api-borrowings] Borrowing deleted:', id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[api-borrowings] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
