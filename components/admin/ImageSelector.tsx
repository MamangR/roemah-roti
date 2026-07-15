'use client';

import React, { useState, useEffect } from 'react';
import { UploadCloud, RefreshCw } from 'lucide-react';

export function ImageSelector({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  
  useEffect(() => {
    fetch('/api/thumbnails')
      .then(res => res.json())
      .then(data => {
        if (data.files) {
          setImages(data.files);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    if (uploadName.trim()) {
      formData.append('name', uploadName.trim());
    }

    try {
      const res = await fetch('/api/thumbnails', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setImages([...images, data.url]);
        onChange(data.url);
        setUploadName(''); // reset
        setSelectedFile(null);
      } else {
        alert('Failed to upload image.');
      }
    } catch (err) {
      alert('Error uploading image.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', color: '#A08A7B', textTransform: 'uppercase' }}>
          {label}
        </div>
        <div 
          onClick={() => setMode(mode === 'upload' ? 'url' : 'upload')} 
          style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, color: '#A67C52', cursor: 'pointer', textTransform: 'uppercase' }}
        >
          <RefreshCw size={13} />
          {mode === 'upload' ? 'Gunakan URL' : 'Upload File'}
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#F8F4EE', padding: '16px', borderRadius: '14px', border: '1px solid #E6DDD0' }}>
        
        {mode === 'upload' ? (
          <>
            {/* Dropdown for existing images */}
            <div>
              <div style={{ fontSize: '13px', color: '#7A6A5F', marginBottom: '4px' }}>Pilih thumbnail tersimpan</div>
              <select 
                value={value || ''} 
                onChange={(e) => onChange(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E6DDD0', borderRadius: '8px', padding: '10px 13px', fontSize: '14px', color: '#3B2A22', outline: 'none' }}
              >
                <option value="">-- Tidak ada gambar terpilih --</option>
                {images.map(img => (
                  <option key={img} value={img}>{img.split('/').pop()}</option>
                ))}
              </select>
            </div>

            <div style={{ height: '1px', background: '#E6DDD0', margin: '8px 0' }} />

            {/* Upload new image */}
            <div>
              <div style={{ fontSize: '13px', color: '#7A6A5F', marginBottom: '6px' }}>Atau upload gambar baru</div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  placeholder="Nama file kustom (opsional)" 
                  value={uploadName} 
                  onChange={e => setUploadName(e.target.value)}
                  style={{ flex: 1, minWidth: '180px', border: '1px solid #E6DDD0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#3B2A22', outline: 'none' }}
                />
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', border: '1px solid #E6DDD0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', fontWeight: 600, color: '#3B2A22', cursor: 'pointer' }}>
                  <UploadCloud size={16} />
                  {selectedFile ? selectedFile.name : 'Pilih File Gambar'}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    disabled={uploading}
                    style={{ display: 'none' }} 
                  />
                </label>
                {selectedFile && (
                  <button 
                    onClick={handleUpload} 
                    disabled={uploading}
                    style={{ background: '#22C55E', color: '#FFF', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer' }}
                  >
                    {uploading ? 'Mengunggah...' : 'Upload ke Server'}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div>
            <div style={{ fontSize: '13px', color: '#7A6A5F', marginBottom: '4px' }}>Masukkan URL Gambar Online</div>
            <input 
              type="text" 
              placeholder="https://..." 
              value={value || ''} 
              onChange={e => onChange(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E6DDD0', borderRadius: '8px', padding: '10px 13px', fontSize: '14px', color: '#3B2A22', outline: 'none' }}
            />
          </div>
        )}

        {/* Preview */}
        {value && (
          <div style={{ marginTop: '8px', background: '#FFFFFF', padding: '8px', borderRadius: '12px', border: '1px solid #E6DDD0', textAlign: 'center' }}>
            <img src={value} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px' }} />
          </div>
        )}
      </div>
    </div>
  );
}
