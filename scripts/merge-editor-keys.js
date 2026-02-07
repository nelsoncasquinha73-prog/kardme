const fs = require('fs')

const langs = ['en','pt','pt-br','es','fr','de','it','ar']

function readJson(p){ return JSON.parse(fs.readFileSync(p,'utf8')) }
function writeJson(p,obj){ fs.writeFileSync(p, JSON.stringify(obj,null,2) + '\n') }

const en = readJson('locales/en.json')
const enEditor = en.editor || {}

for (const lang of langs) {
  const file = `locales/${lang}.json`
  const dict = readJson(file)

  dict.editor = dict.editor || {}

  // adiciona apenas keys que faltam
  for (const [k,v] of Object.entries(enEditor)) {
    if (dict.editor[k] === undefined) dict.editor[k] = v
  }

  writeJson(file, dict)
  console.log(`✅ merged editor keys into ${file}`)
}
