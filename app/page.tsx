'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient.js'

export default function Home() {
  
  async function checkConnection() {
    const { data, error } = await supabase.from('task').select('*').limit(1)
    if (error) {
      console.error('❌ Gagal konek ke Supabase:', error.message)
      alert('Gagal konek ke Supabase: ' + error.message)
    } else {
      console.log('✅ Berhasil konek ke Supabase:', data)
      alert('Berhasil konek ke Supabase!')
    }
  }
  useEffect(() => {
    checkConnection()
  }, [])
  
  return (
    <main style={{ padding: 20, textAlign: 'center' }}>
      <h1>🧩 Tes Koneksi Supabase</h1>
      <p>Buka console (Ctrl+Shift+I → tab Console) untuk lihat hasil tes.</p>
    </main>
  )
}