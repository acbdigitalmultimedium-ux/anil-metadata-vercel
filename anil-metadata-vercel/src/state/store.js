import { create } from 'zustand'
export const useApp = create((set,get)=>({
  files: [], results: {},
  controls:{ titleLen:80, kwCount:25, imageType:'Vector', prefix:'', suffix:'', negativeTitle:false, negativeKeywords:false },
  addFiles:(files)=>{ const list=[...get().files]; for(const f of files){ const id=crypto.randomUUID(); list.push({id,file:f,name:f.name,type:f.type,size:f.size}) } set({files:list}) },
  clearAll:()=>set({files:[],results:{}}),
  setControls:(c)=>set({controls:{...get().controls,...c}}),
  setResult:(id,data)=>set({results:{...get().results,[id]:data}})
}))