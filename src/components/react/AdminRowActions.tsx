import { useState } from 'react';
import { createBrowserSupabase } from '../../lib/supabase/browser';

export default function AdminRowActions({
  productId,
  active,
}: {
  productId: string;
  active: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleActive() {
    setBusy(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase
        .from('products')
        .update({ active: !active })
        .eq('id', productId);
      if (error) throw error;
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al actualizar');
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm('¿Eliminar este producto definitivamente?')) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={toggleActive}
          title={active ? 'Ocultar producto' : 'Publicar producto'}
          aria-pressed={active}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            active ? 'bg-ember' : 'bg-ink/20 dark:bg-paper/20'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
              active ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
        <a
          href={`/admin/producto/${productId}`}
          className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-ink hover:text-paper dark:border-line-dark dark:hover:bg-paper dark:hover:text-ink"
        >
          Editar
        </a>
        <button
          type="button"
          disabled={busy}
          onClick={remove}
          className="rounded-lg border border-ember/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-ember transition-colors hover:bg-ember hover:text-white"
        >
          Eliminar
        </button>
      </div>
      {error && <p className="text-xs font-semibold text-ember">{error}</p>}
    </div>
  );
}