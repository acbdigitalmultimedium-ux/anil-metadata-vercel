import { OpenAI } from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

function simpleGenerate(name, controls){
  const base = name.replace(/[_\-]/g,' ').replace(/\.[a-z0-9]+$/i,'').trim()
  const title = (controls.prefix?controls.prefix+' ':'') + base + (controls.suffix?' '+controls.suffix:'')
  const words = base.toLowerCase().replace(/[^a-z0-9\s]/g,'').split(/\s+/).filter(Boolean)
  const uniq = Array.from(new Set(words))
  const kws = uniq.slice(0, controls.kwCount || 25)
  const desc = `Flat ${controls.imageType||'Vector'} — ${base}. Commercial-use, clean lines, no gradients.`
  return { title: title.slice(0,controls.titleLen||80), description: desc, keywords: kws }
}

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'})
  try{
    const { items, controls } = req.body || {}
    if(!Array.isArray(items)) return res.status(400).json({error:'items[] required'})

    const openaiKey = process.env.OPENAI_API_KEY || ''
    const googleKey = process.env.GOOGLE_API_KEY || ''
    const out = []

    for (const it of items){
      const prompt = `Create metadata for a stock-friendly ${controls?.imageType||'Vector'}. Return JSON with fields title, description, keywords (max ${controls?.kwCount||25}).
Apply prefix "${controls?.prefix||''}" and suffix "${controls?.suffix||''}" to the title if provided. Avoid negative words.`
      let done = false
      if(openaiKey && !done){
        try{
          const oa = new OpenAI({ apiKey: openaiKey })
          const r = await oa.chat.completions.create({
            model:'gpt-4o-mini',
            messages:[{role:'user', content: prompt + '\nFilename: '+it.name}],
            response_format:{type:'json_object'}
          })
          const data = JSON.parse(r.choices[0].message.content)
          out.push({ id: it.id, ...data })
          done = true
        }catch(e){}
      }
      if(googleKey && !done){
        try{
          const gem = new GoogleGenerativeAI(googleKey)
          const model = gem.getGenerativeModel({model:'gemini-1.5-flash'})
          const r = await model.generateContent([prompt+`\nFilename: ${it.name}`])
          const txt = r.response.text()
          const json = JSON.parse(txt.match(/\{[\s\S]*\}$/)[0])
          out.push({ id: it.id, ...json })
          done = true
        }catch(e){}
      }
      if(!done){ out.push({ id: it.id, ...simpleGenerate(it.name, controls||{}) }) }
    }
    res.status(200).json({ items: out })
  }catch(e){ res.status(500).json({ error: e.message || 'Server error' }) }
}