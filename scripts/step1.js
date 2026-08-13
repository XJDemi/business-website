const fs=require('fs')
const p='../admin/index.html'
let c=fs.readFileSync(p,'utf8')
console.log(c.length)
