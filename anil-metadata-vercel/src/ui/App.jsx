
import React, { useRef, useState } from 'react'
import { useApp } from '../state/store.js'
import { fileToDataUrl, download, buildCSV } from '../lib/utils.js'

const styles = `
:root{color-scheme:dark light}
*{box-sizing:border-box}
header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #222}
.brand{display:flex;gap:10px;align-items:center}
small{color:#9aa4b2}
.grid{display:grid;grid-template-columns:320px 1fr;gap:16px;padding:16px}
.card{background:#151822;border:1px solid #222;border-radius:12px;padding:12px}
button{background:#1e2433;color:#d6e3ff;border:1px solid #2a3350;border-radius:10px;padding:10px 14px;cursor:pointer}
button[disabled]{opacity:.5;cursor:not-allowed}
.pill{padding:6px 10px;border-radius:999px;border:1px solid #2a3350;background:#171b27}
input,select{background:#0e1220;border:1px solid #2a3350;color:#e8e8ea;border-radius:10px;padding:10px;width:100%}
.uploader{border:2px dashed #2a3350;border-radius:12px;height:220px;display:flex;align-items:center;justify-content:center;color:#9fb0ff;background:#0c1020}
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.table{width:100%;border-collapse:collapse}
.table th,.table td{border-bottom:1px solid #222;padding:8px;text-align:left;vertical-align:top}
.chip{border:1px solid #2a3350;background:#121524;border-radius:999px;padding:4px 8px;display:inline-block;margin:2px}
img.thumb{width:44px;height:44px;object-fit:contain;background:#0b0f1a;border:1px solid #1d2236;border-radius:6px}
.link{color:#9fb0ff;text-decoration:underline;cursor:pointer}
.danger{background:#2a1115;border-color:#552028;color:#ffb3b9}
.success{background:#102415;border-color:#214a33;color:#b6f0c9}
`

export default function App(){
  const inputRef = useRef()
  const { files, results, addFiles, clearAll, controls, setControls } = useApp()
  const [busy, setBusy] = useState(false)

  const onDrop = (ev) => { ev.preventDefault(); const fs=[...ev.dataTransfer.files].filter(f=>/image|svg|video/.test(f.type)||/\.svg$/i.test(f.name)); addFiles(fs) }
  const onBrowse = (e) => addFiles([...e.target.files])

  const generate = async () => {
    if(!files.length) return; setBusy(true)
    try{
      const payload = await Promise.all(files.map(async f=>({ id:f.id, name:f.name, mime:f.type||'application/octet-stream', preview: await fileToDataUrl(f.file) })))
      const res = await fetch('/api/generate',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ items: payload, controls }) })
      const data = await res.json()
      for(const item of data.items){ useApp.getState().setResult(item.id,{...item, filename:payload.find(p=>p.id===item.id).name}) }
    }catch(e){ alert('Generation failed: '+e.message) }
    setBusy(false)
  }

  const exportCSV = () => { const rows = Object.values(results); if(!rows.length) return alert('Nothing to export yet'); download('metadata.csv', buildCSV(rows)) }

  return (
    <>
      <style>{styles}</style>
      <header>
        <div className="brand"><strong>anil metadata</strong><small> • AI Stock Metadata</small></div>
        <div className="row">
          <a className="link" href="https://csvnest.com" target="_blank" rel="noreferrer">CSVNest (ref)</a>
          <a className="link" href="https://vercel.com" target="_blank" rel="noreferrer">Hosted by Vercel</a>
        </div>
      </header>
      <div className="grid">
        <aside className="card">
          <h3>Controls</h3>
          <label>Title Length: {controls.titleLen}</label>
          <input type="range" min="40" max="120" value={controls.titleLen} onChange={e=>setControls({titleLen:+e.target.value})}/>
          <label>Keywords Count: {controls.kwCount}</label>
          <input type="range" min="10" max="50" value={controls.kwCount} onChange={e=>setControls({kwCount:+e.target.value})}/>
          <label>Image Type</label>
          <select value={controls.imageType} onChange={e=>setControls({imageType:e.target.value})}>
            <option>Vector</option><option>Photo</option><option>Illustration</option>
          </select>
          <label>Prefix</label><input value={controls.prefix} onChange={e=>setControls({prefix:e.target.value})}/>
          <label>Suffix</label><input value={controls.suffix} onChange={e=>setControls({suffix:e.target.value})}/>
          <div className="row">
            <label><input type="checkbox" checked={controls.negativeTitle} onChange={e=>setControls({negativeTitle:e.target.checked})}/> Negative Title</label>
            <label><input type="checkbox" checked={controls.negativeKeywords} onChange={e=>setControls({negativeKeywords:e.target.checked})}/> Negative Keywords</label>
          </div>
        </aside>
        <main className="card">
          <h3>Upload & Generate</h3>
          <div onDragOver={e=>e.preventDefault()} onDrop={onDrop} className="uploader" onClick={()=>document.getElementById('fileinp').click()}>
            Drop files here or click to browse
            <input id="fileinp" type="file" multiple hidden onChange={onBrowse}/>
          </div>
          {files.length>0 && (
            <table className="table" style={{marginTop:14}}>
              <thead><tr><th>Preview</th><th>File</th><th>Metadata</th></tr></thead>
              <tbody>
                {files.map(f=>{
                  const r = results[f.id]
                  return (<tr key={f.id}>
                    <td><img className="thumb" src={URL.createObjectURL(f.file)} alt="thumb"/></td>
                    <td><div><strong>{f.name}</strong></div><small>{Math.round(f.size/1024)} KB</small></td>
                    <td>
                      {r ? (<div>
                        <div><strong>Title:</strong> {r.title}</div>
                        <small>{r.description}</small>
                        <div>{r.keywords.map((k,i)=><span className="chip" key={i}>{k}</span>)}</div>
                      </div>):(<small>Not generated yet</small>)}
                    </td>
                  </tr>)
                })}
              </tbody>
            </table>
          )}
          <div className="row" style={{marginTop:12}}>
            <button className="danger" onClick={()=>useApp.getState().clearAll()}>Clear All</button>
            <button onClick={generate} disabled={busy || !files.length}>{busy?'Generating…':'Generate All'}</button>
            <button className="success" onClick={exportCSV} disabled={!Object.keys(results).length}>Export CSV</button>
          </div>
        </main>
      </div>
    </>
  )
}
