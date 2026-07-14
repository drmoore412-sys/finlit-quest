const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"..");
function loadContent(){const terms=JSON.parse(fs.readFileSync(path.join(ROOT,"content/crypto-terms.json"),"utf8")),context={window:{DEFI_TERMS:terms}};vm.runInNewContext(fs.readFileSync(path.join(ROOT,"worlds/crypto.js"),"utf8"),context);return {terms,world:JSON.parse(JSON.stringify(context.window.FINLIT_WORLD))}}
function memoryStorage(initial={}){const data=new Map(Object.entries(initial));return {getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key),dump:()=>Object.fromEntries(data)}}
module.exports={ROOT,loadContent,memoryStorage};
