'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

interface Task {
  id: number;
  created_at: string;
  job: string;
  assignor: string;
  jobdesc: string | null;
  deadline: string;
  finishdate: string | null;
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Belum selesai';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [job, setJob] = useState('')
  const [assignor, setAssignor] = useState('')
  const [jobdesc, setJobdesc] = useState('')
  const [deadline, setDeadline] = useState('')
  const [finishdate, setFinishdate] = useState('') 
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false) // Tambah state submit protection

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null) // Reset error saat mulai fetch
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('id, created_at, job, assignor, jobdesc, deadline, finishdate')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setTasks(data || [])
      setError(null) // Clear error jika fetch sukses
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga'
      console.error('❌ Gagal mengambil data:', errorMessage)
      setError(errorMessage)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  async function handleSubmit() {
    if (!job || !assignor || !deadline) {
      alert('Nama Tugas, Pemberi Tugas, dan Deadline tidak boleh kosong!')
      return
    }

    // ✅ Perbaikan Validasi Tanggal (Timezone-safe)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // Format YYYY-MM-DD UTC

    if (deadline < todayStr) {
      alert('Deadline harus hari ini atau di masa depan!');
      return;
    }

    if (finishdate && finishdate > deadline) {
      alert('Tanggal selesai tidak boleh melebihi deadline!');
      return;
    }

    setIsSubmitting(true)
    try {
      let query;
      const finishDateValue = finishdate || null; // Konversi string kosong ke null

      if (editingId) {
        query = supabase
          .from('todos')
          .update({ 
            job, 
            assignor, 
            jobdesc: jobdesc || null, 
            deadline, 
            finishdate: finishDateValue 
          })
          .eq('id', editingId)
      } else {
        query = supabase
          .from('todos')
          .insert([{ 
            job, 
            assignor, 
            jobdesc: jobdesc || null, 
            deadline, 
            finishdate: finishDateValue 
          }])
      }

      const { error } = await query;
      if (error) throw error;

      resetForm();
      await fetchTasks();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal menyimpan data'
      console.error('❌ Gagal simpan data:', errorMessage)
      alert(`Gagal ${editingId ? 'Update' : 'Tambah'} data: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function deleteTask(id: number) {
    if (!confirm('Yakin ingin menghapus tugas ini?')) return;
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (error) throw error;
      await fetchTasks();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal menghapus data'
      alert('Gagal hapus data: ' + errorMessage)
      console.error('❌ Gagal hapus data:', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  function editTask(task: Task) {
    setJob(task.job)
    setAssignor(task.assignor)
    setJobdesc(task.jobdesc || '')
    setDeadline(task.deadline)
    // ✅ Perbaikan: Handle null finishdate
    setFinishdate(task.finishdate || '')
    setEditingId(task.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setJob('')
    setAssignor('')
    setJobdesc('')
    setDeadline('')
    setFinishdate('') // Pastikan direset ke string kosong
    setEditingId(null)
  }

  return (
    <main className="p-5 md:p-10 text-center max-w-xl mx-auto min-h-screen bg-black text-white">
      <h1 className="text-4xl font-extrabold text-red-500 mb-10">
        Manajemen Tugas 📋
      </h1>

      <div className="bg-gray-900 border-t-4 border-red-600 p-6 rounded-xl shadow-lg mb-10 text-left">
        <h2 className="text-2xl font-bold text-white mb-5 border-b border-red-700 pb-2">
          {editingId ? '✏️ Edit Tugas' : '➕ Tambah Tugas Baru'}
        </h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-200 mb-1">Nama Tugas:</label>
          <input 
            type="text" 
            value={job} 
            onChange={(e) => setJob(e.target.value)} 
            placeholder="Contoh: Membuat Laporan..."
            className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:ring-red-400 focus:border-red-500 disabled:bg-gray-700"
            disabled={loading || isSubmitting}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-200 mb-1">Pemberi Tugas:</label>
          <input 
            type="text" 
            value={assignor} 
            onChange={(e) => setAssignor(e.target.value)} 
            placeholder="Contoh: Pak Budi..."
            className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:ring-red-400 focus:border-red-500 disabled:bg-gray-700"
            disabled={loading || isSubmitting}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-200 mb-1">Deadline:</label>
          <input 
            type="date" 
            value={deadline} 
            onChange={(e) => setDeadline(e.target.value)} 
            className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:ring-red-400 focus:border-red-500 disabled:bg-gray-700"
            min={new Date().toISOString().split('T')[0]} // Batasi tanggal minimum
            disabled={loading || isSubmitting}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-200 mb-1">Tanggal Selesai (Opsional):</label>
          <input 
            type="date" 
            value={finishdate} 
            onChange={(e) => setFinishdate(e.target.value)} 
            className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:ring-red-400 focus:border-red-500 disabled:bg-gray-700"
            max={deadline || undefined} // Batasi maksimal sesuai deadline
            disabled={loading || isSubmitting}
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-200 mb-1">Keterangan Tugas:</label>
          <textarea 
            value={jobdesc} 
            onChange={(e) => setJobdesc(e.target.value)} 
            placeholder="Deskripsi detail tugas..."
            rows={3}
            className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:ring-red-400 focus:border-red-500 disabled:bg-gray-700"
            disabled={loading || isSubmitting}
          />
        </div>

        <div className="flex justify-end gap-3">
          {editingId && (
            <button 
              onClick={resetForm} 
              className="px-4 py-2 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition duration-150 disabled:opacity-50"
              disabled={loading || isSubmitting}
            >
              Batal Edit
            </button>
          )}
          <button 
            onClick={handleSubmit} 
            className={`px-4 py-2 text-white font-semibold rounded-lg transition duration-150 disabled:opacity-50 ${
              editingId 
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-red-600 hover:bg-red-700'
            }`}
            disabled={loading || isSubmitting}
          >
            {(loading || isSubmitting) 
              ? 'Memproses...' 
              : editingId 
                ? '💾 Simpan Perubahan' 
                : '➕ Tambah Tugas'
            }
          </button>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-white mb-6 mt-10 border-b-2 border-red-600 pb-2">
        Daftar Tugas Saat Ini
      </h2>
      
      {loading && <p className="text-red-400 font-semibold mt-4">Mengambil data...</p>}
      
      {error && <p className="text-red-300 mt-4 font-medium">⚠️ Error: {error}</p>}

      {!loading && !error && (
        <div className="text-left">
          {tasks.length > 0 ? (
            <ul className="space-y-4">
              {tasks.map((task) => (
                <li 
                  key={task.id} 
                  className="bg-gray-800 border-l-4 border-red-600 p-4 rounded-xl shadow-md hover:shadow-lg transition duration-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-red-400">
                      {task.job}
                    </h3>
                    <div className="text-sm text-red-300">
                      Dibuat: {formatDate(task.created_at)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-200 mb-1">
                    <strong className="text-red-300">Pemberi Tugas:</strong> {task.assignor}
                  </p>
                  <p className="text-sm text-gray-200 mb-1">
                    <strong className="text-red-300">Deadline:</strong> {formatDate(task.deadline)}
                  </p>
                  <p className="text-sm text-gray-200 mb-1">
                    <strong className="text-red-300">Selesai:</strong> {formatDate(task.finishdate)}
                  </p>
                  <p className="text-sm text-gray-200 mb-3 pl-3">
                    {task.jobdesc || 'Tidak ada keterangan.'}
                  </p>
                  
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => editTask(task)} 
                      className="px-3 py-1 text-sm bg-red-500 text-white font-medium rounded-md hover:bg-red-600 transition disabled:opacity-50"
                      disabled={loading}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => deleteTask(task.id)} 
                      className="px-3 py-1 text-sm bg-gray-700 text-white font-medium rounded-md hover:bg-gray-600 transition disabled:opacity-50"
                      disabled={loading}
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 mt-4">Tidak ada data tugas yang ditemukan. Silakan tambahkan tugas baru.</p>
          )}
        </div>
      )}
    </main>
  )
}