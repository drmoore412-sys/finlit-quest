(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitCandidateSourceCollector=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const DEFAULT_STOP_WORDS=new Set("A AN AND ARE AS AT BE BY FOR FROM HAS HAVE HE HER HIS I IN IS IT ITS OF ON OR OUR SHE THAT THE THEIR THEM THEY THIS TO WAS WE WERE WILL WITH YOU YOUR".split(" "));

  function decodeEntities(value){return String(value||"").replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Number(code)))}
  function textFromHtml(html){return decodeEntities(String(html||"").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ")).replace(/\s+/g," ").trim()}
  function normalizeWord(value){return String(value||"").toUpperCase().replace(/[^A-Z]/g,"")}

  function extractKeywords(text,options={}){
    const minLength=Number.isInteger(options.minLength)?options.minLength:3,maxLength=Number.isInteger(options.maxLength)?options.maxLength:9;
    const stopWords=new Set([...(options.stopWords||DEFAULT_STOP_WORDS)].map(normalizeWord));
    const counts=new Map();
    for(const token of String(text||"").match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)||[]){
      if(/[’'-]/.test(token))continue;
      const word=normalizeWord(token);
      if(word.length<minLength||word.length>maxLength||stopWords.has(word))continue;
      counts.set(word,(counts.get(word)||0)+1);
    }
    return [...counts].map(([word,count])=>({word,count})).sort((a,b)=>b.count-a.count||a.word.localeCompare(b.word));
  }

  function collectDocuments(documents,options={}){
    const byWord=new Map();
    for(const document of documents||[]){
      const sourceId=String(document.id||document.url||document.path||"unknown"),text=document.contentType==="text/html"?textFromHtml(document.text):String(document.text||"");
      for(const keyword of extractKeywords(text,options)){
        const record=byWord.get(keyword.word)||{word:keyword.word,totalCount:0,documentCount:0,sources:[],approvalStatus:"unreviewed"};
        record.totalCount+=keyword.count;record.documentCount++;record.sources.push({sourceId,url:document.url||null,path:document.path||null,count:keyword.count});byWord.set(keyword.word,record);
      }
    }
    const records=[...byWord.values()].sort((a,b)=>b.documentCount-a.documentCount||b.totalCount-a.totalCount||a.word.localeCompare(b.word));
    return {schemaVersion:1,generatedAt:new Date().toISOString(),documentCount:(documents||[]).length,keywordCount:records.length,keywords:records};
  }

  return {DEFAULT_STOP_WORDS:[...DEFAULT_STOP_WORDS],decodeEntities,textFromHtml,normalizeWord,extractKeywords,collectDocuments};
});
