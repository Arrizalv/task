'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// Definisikan tipe untuk item tugas agar kode lebih aman dan terstruktur
interface Task {
  id: number;
  created_at: string; // Tanggal dibuat (string dari Supabase, bisa di-parse sebagai Date)
  job: string;
  assignor: string;
  jobdesc: string | null;
  deadline: string; // Tanggal deadline (string)
  finishdate: string | null; // Tanggal selesai (string, bisa null)
}

// Fungsi Utilitas sederhana untuk memformat tanggal
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Belum ditentukan';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
};

export default function Home() {
  // --- STATE (Ditambahkan Tipe Data) ---
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [job, setJob] = useState('')
  const [assignor, setAssignor] = useState('')
  const [jobdesc, setJobdesc] = useState('')
  const [deadline, setDeadline] = useState('') // String untuk input date
  const [finishdate, setFinishdate] = useState('') // String untuk input date, optional
  const [editingId, setEditingId] = useState<number | null>(null) 

  // --- FUNGSI CRUD & UTILITY ---
  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('todos') // Nama tabel diubah ke 'todos'
      .select('id, created_at, job, assignor, jobdesc, deadline, finishdate') // Pastikan nama kolom sesuai di Supabase
      .order('created_at', { ascending: false }) // Urutkan berdasarkan tanggal dibuat, terbaru dulu
    
    if (error) {
      console.error('❌ Gagal mengambil data:', error.message)
      setError(error.message)
      setTasks([])
    } else {
      setTasks(data as Task[]) // Type-casting data
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTasks() 
  }, [fetchTasks])

  async function handleSubmit() {
    if (!job || !assignor || !deadline) {
      alert('Nama Tugas, Pemberi Tugas, dan Deadline tidak boleh kosong!')
      return
    }
    
    // Validasi tanggal deadline (harus di masa depan atau hari ini)
    const deadlineDate = new Date(deadline);
    const now = new Date();
    if (deadlineDate < now.setHours(0, 0, 0, 0)) {
      alert('Deadline harus hari ini atau di masa depan!');
      return;
    }
    
    // Jika finishdate diisi, pastikan valid
    let finishDateValue: string | null = null;
    if (finishdate) {
      const finishDate = new Date(finishdate);
      if (finishDate > deadlineDate) {
        alert('Tanggal selesai tidak boleh melebihi deadline!');
        return;
      }
      finishDateValue = finishdate;
    }
    
    setLoading(true)
    let error
    
    if (editingId) {
      // MODE UPDATE
      const { error: updateError } = await supabase
        .from('todos') // Nama tabel diubah ke 'todos'
        .update({ job, assignor, jobdesc, deadline, finishdate: finishDateValue })
        .eq('id', editingId)
      error = updateError
    } else {
      // MODE CREATE (created_at akan di-set otomatis oleh Supabase jika ada default)
      const { error: createError } = await supabase
        .from('todos') // Nama tabel diubah ke 'todos'
        .insert({ job, assignor, jobdesc, deadline, finishdate: finishDateValue })
      error = createError
    }

    if (error) {
      console.error('❌ Gagal simpan data:', error.message)
      alert(`Gagal ${editingId ? 'Update' : 'Tambah'} data: ${error.message}`)
    } else {
      resetForm()
      await fetchTasks()
    }
    setLoading(false)
  }

  async function deleteTask(id: number) { // Tambahkan tipe number
    if (window.confirm('Yakin ingin menghapus tugas ini?')) {
      setLoading(true)
      const { error } = await supabase
        .from('todos') // Nama tabel diubah ke 'todos'
        .delete()
        .eq('id', id)

      if (error) {
        console.error('❌ Gagal hapus data:', error.message)
        alert('Gagal hapus data: ' + error.message)
      } else {
        await fetchTasks() 
      }
      setLoading(false)
    }
  }

  function editTask(task: Task) { // Tambahkan tipe Task
    setJob(task.job)
    setAssignor(task.assignor)
    setJobdesc(task.jobdesc || '')
    setDeadline(task.deadline)
    setFinishdate(task.finishdate || '')
    setEditingId(task.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setJob('')
    setAssignor('')
    setJobdesc('')
    setDeadline('')
    setFinishdate('')
    setEditingId(null)
  }

  // --- RENDERING (Tampilan) ---
  return (
    <main className="p-5 md:p-10 text-center max-w-xl mx-auto min-h-screen bg-gray-50">
      <h1 className="text-4xl font-extrabold text-blue-700 mb-10">
        Manajemen Tugas 📋
      </h1>

      {/* --- FORM INPUT (CREATE/UPDATE) --- */}
      <div className="bg-white border-t-4 border-blue-500 p-6 rounded-xl shadow-lg mb-10 text-left">
        <h2 className="text-2xl font-bold text-gray-800 mb-5 border-b pb-2">
          {editingId ? '✏️ Edit Tugas' : '➕ Tambah Tugas Baru'}
        </h2>
        
        {/* Nama Tugas */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Tugas:</label>
          <input 
            type="text" 
            value={job} 
            onChange={(e) => setJob(e.target.value)} 
            placeholder="Contoh: Membuat Laporan..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            disabled={loading}
          />
        </div>
        
        {/* Pemberi Tugas */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Pemberi Tugas:</label>
          <input 
            type="text" 
            value={assignor} 
            onChange={(e) => setAssignor(e.target.value)} 
            placeholder="Contoh: Pak Budi..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            disabled={loading}
          />
        </div>
        
        {/* Deadline */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Deadline:</label>
          <input 
            type="date" 
            value={deadline} 
            onChange={(e) => setDeadline(e.target.value)} 
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            disabled={loading}
          />
        </div>
        
        {/* Tanggal Selesai (Opsional) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai (Opsional):</label>
          <input 
            type="date" 
            value={finishdate} 
            onChange={(e) => setFinishdate(e.target.value)} 
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            disabled={loading}
          />
        </div>
        
        {/* Keterangan Tugas */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan Tugas:</label>
          <textarea 
            value={jobdesc} 
            onChange={(e) => setJobdesc(e.target.value)} 
            placeholder="Deskripsi detail tugas..."
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            disabled={loading}
          />
        </div>

        {/* Tombol Submit & Batal */}
        <div className="flex justify-end gap-3">
          {editingId && (
            <button 
              onClick={resetForm} 
              className="px-4 py-2 bg-gray-400 text-white font-medium rounded-lg hover:bg-gray-500 transition duration-150 disabled:opacity-50"
              disabled={loading}
            >
              Batal Edit
            </button>
          )}
          <button 
            onClick={handleSubmit} 
            className={`px-4 py-2 text-white font-semibold rounded-lg transition duration-150 disabled:opacity-50 ${
              editingId 
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={loading}
          >
            {loading ? 'Memproses...' : editingId ? '💾 Simpan Perubahan' : '➕ Tambah Tugas'}
          </button>
        </div>
      </div>

      {/* --- DAFTAR DATA (READ) --- */}
      <h2 className="text-3xl font-bold text-gray-800 mb-6 mt-10 border-b-2 border-blue-500 pb-2">Daftar Tugas Saat Ini</h2>
      
      {loading && <p className="text-blue-600 font-semibold mt-4">Mengambil data...</p>}
      
      {error && <p className="text-red-500 mt-4 font-medium">⚠️ Error: {error}</p>}

      {!loading && !error && (
        <div className="text-left">
          {tasks.length > 0 ? (
            <ul className="space-y-4">
              {tasks.map((task) => (
                <li 
                  key={task.id} 
                  className="bg-white border-l-4 border-blue-400 p-4 rounded-xl shadow-md hover:shadow-lg transition duration-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-blue-700">
                      {task.job}
                    </h3>
                    <div className="text-sm text-gray-500">
                      Dibuat: {formatDate(task.created_at)}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Pemberi Tugas:</strong> {task.assignor}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Deadline:</strong> {formatDate(task.deadline)}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Selesai:</strong> {formatDate(task.finishdate)}
                  </p>
                  <p className="text-sm text-gray-600 mb-3 pl-3">
                    {task.jobdesc || 'Tidak ada keterangan.'}
                  </p>
                  
                  {/* Tombol Aksi */}
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => editTask(task)} 
                      className="px-3 py-1 text-sm bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition disabled:opacity-50"
                      disabled={loading}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => deleteTask(task.id)} 
                      className="px-3 py-1 text-sm bg-red-500 text-white font-medium rounded-md hover:bg-red-600 transition disabled:opacity-50"
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
