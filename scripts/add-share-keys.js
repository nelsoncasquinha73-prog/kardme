const fs = require('fs')

const langs = ['en','pt','pt-br','es','fr','de','it','ar']
const shareKeys = {
  "share": {
    "title": "Share My vCard",
    "whatsapp": "Share on WhatsApp",
    "messenger": "Share on Messenger",
    "telegram": "Share on Telegram",
    "sms": "Share via SMS",
    "email": "Share via Email",
    "twitter": "Share on Twitter",
    "linkedin": "Share on LinkedIn",
    "copy_link": "Copy link",
    "copied": "Copied!",
    "default_title": "See my digital card"
  }
}

// Traduções para PT
const sharePT = {
  "share": {
    "title": "Partilhar Cartão",
    "whatsapp": "Partilhar no WhatsApp",
    "messenger": "Partilhar no Messenger",
    "telegram": "Partilhar no Telegram",
    "sms": "Partilhar por SMS",
    "email": "Partilhar por Email",
    "twitter": "Partilhar no Twitter",
    "linkedin": "Partilhar no LinkedIn",
    "copy_link": "Copiar link",
    "copied": "Copiado!",
    "default_title": "Vê o meu cartão digital"
  }
}

for (const lang of langs) {
  const file = `locales/${lang}.json`
  const dict = JSON.parse(fs.readFileSync(file,'utf8'))
  
  const keys = lang === 'pt' ? sharePT : shareKeys
  dict.share = { ...dict.share, ...keys.share }
  
  fs.writeFileSync(file, JSON.stringify(dict,null,2) + '\n')
  console.log(`✅ added share keys to ${file}`)
}
