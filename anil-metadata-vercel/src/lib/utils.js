export async function fileToDataUrl(file){
  return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file) })
}
export function download(filename, text){
  const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(text); a.download=filename; a.click()
}
export function buildCSV(rows){
  const esc=(s)=>(''+s).replaceAll('"','""'); const head=['filename','title','description','keywords']; const out=[head.join(',')]
  for(const r of rows){ out.push([r.filename,`"${esc(r.title)}"`,`"${esc(r.description)}"`,`"${r.keywords.join('; ')}"`].join(',')) } return out.join('\n')
}