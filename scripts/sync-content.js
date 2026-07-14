const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),jsonPath=path.join(root,"content/crypto-terms.json"),adapterPath=path.join(root,"content/crypto-terms.js");
if(process.argv.includes("--bootstrap")){const context={window:{}};vm.runInNewContext(fs.readFileSync(adapterPath,"utf8"),context);fs.writeFileSync(jsonPath,`${JSON.stringify(context.window.DEFI_TERMS,null,2)}\n`);console.log(`Created ${jsonPath}`)}
else{const terms=JSON.parse(fs.readFileSync(jsonPath,"utf8"));fs.writeFileSync(adapterPath,`// Generated from content/crypto-terms.json. Do not edit by hand.\nwindow.DEFI_TERMS = ${JSON.stringify(terms,null,2)};\n`);console.log(`Updated ${adapterPath}`)}
