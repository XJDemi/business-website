const fs=require('fs')
const p='../admin/index.html'
let c=fs.readFileSync(p,'utf8')
let s='<div id="inquiries-content"'
let i=c.indexOf(s)
console.log('Index:',i)
