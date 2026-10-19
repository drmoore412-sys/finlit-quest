(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitCrosswordCandidatePipeline=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const FINANCIAL_MINIMUM=Object.freeze({3:2,4:3,5:3});
  function normalizeWord(value){return String(value||"").trim().toUpperCase()}
  function counts(value){const result={};for(const letter of normalizeWord(value))result[letter]=(result[letter]||0)+1;return result}
  function canForm(word,letters){const available=Array.isArray(letters)?counts(letters.join("")):counts(letters);return Object.entries(counts(word)).every(([letter,total])=>(available[letter]||0)>=total)}
  function canonicalLayout(placements){
    if(!placements.length)return "";
    let minR=Infinity,minC=Infinity;for(const item of placements){minR=Math.min(minR,item.r);minC=Math.min(minC,item.c)}
    return placements.map(item=>({word:item.word,r:item.r-minR,c:item.c-minC,dir:item.dir})).sort((a,b)=>a.word.localeCompare(b.word)||a.dir.localeCompare(b.dir)||a.r-b.r||a.c-b.c).map(item=>`${item.word}:${item.r},${item.c},${item.dir}`).join("|");
  }
  function permutationsForLayouts(words,limit=48){
    const result=[],seen=new Set();
    function add(list){const key=list.join("|");if(!seen.has(key)&&result.length<limit){seen.add(key);result.push(list)}}
    add([...words]);
    for(let first=0;first<words.length&&result.length<limit;first++){
      const rest=words.filter((_,index)=>index!==first);add([words[first],...rest]);add([words[first],...rest].slice(0,1).concat(rest.reverse()));
      for(let shift=1;shift<rest.length&&result.length<limit;shift++)add([words[first],...rest.slice(shift),...rest.slice(0,shift)]);
    }
    return result;
  }
  function layoutMetrics(placements){
    const cells=new Map();let maxR=0,maxC=0,crossings=0;
    for(const item of placements)for(let i=0;i<item.word.length;i++){
      const r=item.r+(item.dir==="v"?i:0),c=item.c+(item.dir==="h"?i:0),key=`${r},${c}`,prior=cells.get(key)||0;cells.set(key,prior+1);maxR=Math.max(maxR,r);maxC=Math.max(maxC,c);
    }
    crossings=[...cells.values()].filter(total=>total>1).length;
    const area=(maxR+1)*(maxC+1),density=area?cells.size/area:0;
    return {crossings,rows:maxR+1,columns:maxC+1,area,density:+density.toFixed(4)};
  }
  function enumerateLayouts(words,deps={},options={}){
    const {solveCrosswordFn,validateCrosswordLayoutFn}=deps,maxLayouts=Number.isInteger(options.maxLayouts)?options.maxLayouts:3,attemptLimit=Number.isInteger(options.attemptLimit)?options.attemptLimit:48;
    if(!solveCrosswordFn||!validateCrosswordLayoutFn)return [];
    const layouts=[],seen=new Set();
    for(const order of permutationsForLayouts(words,attemptLimit)){
      const solved=solveCrosswordFn(order,options.solverOptions||{});if(!solved.ok)continue;
      const validation=validateCrosswordLayoutFn(words,solved.placements);if(!validation.valid)continue;
      const signature=canonicalLayout(solved.placements);if(seen.has(signature))continue;seen.add(signature);
      layouts.push({placements:solved.placements.map(item=>({...item})),metrics:layoutMetrics(solved.placements),solver:{nodes:solved.nodes,score:solved.score,reason:solved.reason}});
    }
    return layouts.sort((a,b)=>b.metrics.crossings-a.metrics.crossings||b.metrics.density-a.metrics.density||a.metrics.area-b.metrics.area).slice(0,maxLayouts);
  }

  function createRegistry(terms){
    const byId=new Map(),byWord=new Map(),errors=[];
    for(const raw of terms||[]){
      const term={id:String(raw.id||raw.termId||""),word:normalizeWord(raw.word),definition:String(raw.definition||""),world:String(raw.world||raw.worldId||"")};
      if(!term.id||!term.word||!term.definition||!term.world){errors.push({rule:"authoritativeTermComplete",word:term.word||null,explanation:"A governed term is missing id, word, definition, or world."});continue}
      if(byId.has(term.id))errors.push({rule:"uniqueTermId",word:term.word,explanation:`Duplicate permanent term ID ${term.id}.`});
      if(byWord.has(term.word)&&byWord.get(term.word).id!==term.id)errors.push({rule:"uniqueFinancialWord",word:term.word,explanation:`${term.word} maps to more than one permanent identity.`});
      byId.set(term.id,Object.freeze(term));byWord.set(term.word,Object.freeze(term));
    }
    return {terms:[...byId.values()],byId,byWord,errors};
  }
  function financialAnswer(term,puzzleWorldId,category){return {word:term.word,category,termId:term.id,masteryId:term.id,definition:term.definition,worldId:term.world,rewardPolicy:"financial-first-solve",...(term.world!==puzzleWorldId?{crossWorld:true}:{})}}
  function ordinaryAnswer(record,puzzleWorldId){return {word:normalizeWord(record.word),category:"ordinary",termId:null,masteryId:null,definition:null,worldId:puzzleWorldId,rewardPolicy:"ordinary-first-solve",supportApproval:record.approvalStatus||"unreviewed",familiarity:Number(record.familiarity||record.totalCount||0),sources:record.sources||[]}}

  function detailedLayoutChecks(words,placements,engineResult){
    const failures=[],cells=new Map();
    for(const item of placements||[])if(!Number.isInteger(item.r)||!Number.isInteger(item.c)||!['h','v'].includes(item.dir))failures.push({rule:"coordinatesValid",words:[item.word],coordinates:{row:item.r,column:item.c},explanation:"Placement coordinates must be integers and direction must be h or v."});
    for(const item of placements||[]){
      if(!Number.isInteger(item.r)||!Number.isInteger(item.c)||!['h','v'].includes(item.dir))continue;
      for(let index=0;index<item.word.length;index++){
        const row=item.r+(item.dir==="v"?index:0),column=item.c+(item.dir==="h"?index:0),key=`${row},${column}`,prior=cells.get(key);
        if(prior&&prior.letter!==item.word[index])failures.push({rule:"crossingLetters",words:[...prior.words,item.word],coordinates:{row,column},explanation:`Conflicting crossing letters ${prior.letter} and ${item.word[index]} at row ${row}, column ${column}.`});
        if(prior&&prior.directions.has(item.dir))failures.push({rule:"distinctSlotDirection",words:[...prior.words,item.word],coordinates:{row,column},explanation:"Two required slots overlap in the same direction."});
        const cell=prior||{letter:item.word[index],directions:new Set(),words:new Set()};cell.directions.add(item.dir);cell.words.add(item.word);cells.set(key,cell);
      }
    }
    for(const word of words){const slots=(placements||[]).filter(item=>item.word===word);if(slots.length!==1)failures.push({rule:"containedWordHasDistinctSlot",words:[word],explanation:`${word} must have exactly one explicit crossword slot; found ${slots.length}.`})}
    for(const item of placements||[]){
      if(!Number.isInteger(item.r)||!Number.isInteger(item.c)||!['h','v'].includes(item.dir))continue;
      const before={row:item.r-(item.dir==="v"?1:0),column:item.c-(item.dir==="h"?1:0)},after={row:item.r+(item.dir==="v"?item.word.length:0),column:item.c+(item.dir==="h"?item.word.length:0)};
      for(const point of [before,after])if(cells.has(`${point.row},${point.column}`))failures.push({rule:"wordSeparation",words:[item.word,...cells.get(`${point.row},${point.column}`).words],coordinates:point,explanation:"A required slot has an occupied end boundary."});
      for(let index=0;index<item.word.length;index++){
        const row=item.r+(item.dir==="v"?index:0),column=item.c+(item.dir==="h"?index:0),cell=cells.get(`${row},${column}`);if(cell&&cell.directions.size===2)continue;
        const sides=item.dir==="h"?[[row-1,column],[row+1,column]]:[[row,column-1],[row,column+1]];
        for(const [sideRow,sideColumn] of sides)if(cells.has(`${sideRow},${sideColumn}`))failures.push({rule:"wordSeparation",words:[item.word,...cells.get(`${sideRow},${sideColumn}`).words],coordinates:{row:sideRow,column:sideColumn},explanation:"Uncrossed letters from separate slots touch edge-to-edge."});
      }
    }
    if(engineResult&&!engineResult.valid)for(const rule of engineResult.errors||[])failures.push({rule,words:[],coordinates:null,explanation:`The strict crossword engine rejected this layout (${rule}).`});
    const seen=new Set();return failures.filter(item=>{const signature=JSON.stringify(item);if(seen.has(signature))return false;seen.add(signature);return true});
  }
  function validateCandidate(candidate,deps={}){
    const registry=deps.registry,ordinaryByWord=deps.ordinaryByWord||new Map(),validateCrosswordLayoutFn=deps.validateCrosswordLayoutFn,required=candidate.answers.filter(answer=>answer.category!=="bonus"),words=required.map(answer=>answer.word),failures=[];
    const layoutResult=validateCrosswordLayoutFn?validateCrosswordLayoutFn(words,candidate.layout):{valid:false,errors:["strictValidatorUnavailable"]};
    failures.push(...detailedLayoutChecks(words,candidate.layout,layoutResult));
    for(const answer of required){
      if(!canForm(answer.word,candidate.wheelLetters))failures.push({rule:"exactLetterMultiset",words:[answer.word],explanation:`${answer.word} cannot be built from the exact wheel inventory.`});
      if(answer.category.startsWith("financial-")){
        const governed=registry&&registry.byId.get(answer.termId);
        if(!governed||governed.word!==answer.word||governed.definition!==answer.definition||governed.world!==answer.worldId||answer.masteryId!==answer.termId)failures.push({rule:"approvedFinancialIdentity",words:[answer.word],explanation:`${answer.word} does not exactly match its authoritative permanent ID, definition, world, and mastery identity.`});
      }else if(answer.category==="ordinary"){
        const support=ordinaryByWord.get(answer.word);
        if(!support||support.approvalStatus!=="approved-support")failures.push({rule:"approvedOrdinaryVocabulary",words:[answer.word],explanation:`${answer.word} is not an owner-approved ordinary supporting word.`});
      }
    }
    const financial=required.filter(answer=>answer.category.startsWith("financial-")).length,minimum=FINANCIAL_MINIMUM[required.length];
    if(minimum===undefined||financial<minimum)failures.push({rule:"financialMajority",words,explanation:`${required.length} required words contain ${financial} financial terms; minimum is ${minimum===undefined?"undefined":minimum}.`});
    const policy=candidate.rewardPolicy||{};
    if(policy.financial?.coinsPerLetter!==7||policy.financial?.xpPerLetter!==1.5||policy.financial?.roundXp!==true||policy.ordinary?.coinsPerWord!==1||policy.ordinary?.xp!==0||policy.bonus?.coins!==0||policy.bonus?.xp!==0)failures.push({rule:"rewardProtection",words:[],explanation:"Candidate reward policy differs from the governed V3 policy."});
    const categories=["crossingLetters","wordSeparation","exactLetterMultiset","vocabularyAndFinancialMajority","containedWordValidation","rewardProtection","engineAcceptance"];
    return {status:failures.length?"FAIL":"PASS",eligible:failures.length===0,categories,failures};
  }

  function rankCandidate(candidate,validation,options={}){
    if(!validation.eligible)return {eligible:false,score:null,factors:{},explanation:["Candidate is invalid; ranking is withheld until every validation gate passes."]};
    const required=candidate.answers.filter(answer=>answer.category!=="bonus"),financial=required.filter(answer=>answer.category.startsWith("financial-")),ordinary=required.filter(answer=>answer.category==="ordinary"),metrics=layoutMetrics(candidate.layout);
    const factors={
      financialStrength:Math.min(20,Math.round(20*financial.length/required.length)),
      educationalRelevance:Math.round(25*(financial.reduce((sum,item)=>sum+(item.worldId===candidate.worldId?1:.7),0)/Math.max(1,financial.length))),
      connectivity:Math.min(20,Math.round(metrics.crossings/Math.max(1,required.length-1)*15+metrics.density*5)),
      ordinaryFamiliarity:ordinary.length?Math.min(10,Math.round(ordinary.reduce((sum,item)=>sum+Math.min(1,(item.familiarity||0)/10),0)/ordinary.length*10)):10,
      difficultyFit:Math.max(0,10-Math.abs((options.targetDifficultyWords||4)-required.length)*3),
      repetition:Math.max(0,10-Math.min(10,Number(options.repetitionCount||0)*2)),
      alternatives:Math.min(5,Number(candidate.alternativeLayoutCount||1)*2),
    };
    const score=Object.values(factors).reduce((sum,value)=>sum+value,0);
    return {eligible:true,score,factors,explanation:[`${financial.length} of ${required.length} answers are governed financial terms.`,`${metrics.crossings} valid crossings in a ${metrics.rows}×${metrics.columns} grid.`,`${candidate.alternativeLayoutCount||1} distinct valid layout(s) were found.`,options.repetitionCount?`Anchor appears ${options.repetitionCount} time(s) in the comparison set.`:"No compared-world repetition was supplied."]};
  }

  function combinations(items,size,limit){const output=[];function walk(start,chosen){if(output.length>=limit)return;if(chosen.length===size){output.push(chosen);return}for(let i=start;i<=items.length-(size-chosen.length);i++){walk(i+1,[...chosen,items[i]]);if(output.length>=limit)return}}walk(0,[]);return output}
  function generateCandidates(input,deps={},options={}){
    const registry=deps.registry,anchor=registry&&registry.byId.get(input.anchorTermId);if(!anchor)throw new Error(`Unknown governed anchor term ID: ${input.anchorTermId}`);
    const worldId=input.worldId||anchor.world,wheelLetters=[...anchor.word],financialPool=registry.terms.filter(term=>term.id!==anchor.id&&canForm(term.word,wheelLetters)),ordinaryPool=(input.ordinaryWords||[]).map(record=>({...record,word:normalizeWord(record.word)})).filter(record=>record.word&&canForm(record.word,wheelLetters));
    const pool=[...financialPool.map(term=>({kind:"financial",term})),...ordinaryPool.map(record=>({kind:"ordinary",record}))],candidateLimit=options.candidateLimit||50,combinationLimit=options.combinationLimit||5000,results=[];let examined=0;
    for(const total of [5,4,3]){
      for(const group of combinations(pool,total-1,Math.max(0,combinationLimit-examined))){
        examined++;const financialCount=1+group.filter(item=>item.kind==="financial").length;if(financialCount<(FINANCIAL_MINIMUM[total]||Infinity))continue;
        const answers=[financialAnswer(anchor,worldId,"financial-anchor"),...group.map(item=>item.kind==="financial"?financialAnswer(item.term,worldId,"financial-secondary"):ordinaryAnswer(item.record,worldId))],words=answers.map(answer=>answer.word);
        if(new Set(words).size!==words.length)continue;
        const layouts=enumerateLayouts(words,deps,{maxLayouts:options.maxLayouts||3,attemptLimit:options.layoutAttempts||48,solverOptions:options.solverOptions});if(!layouts.length)continue;
        for(let index=0;index<layouts.length&&results.length<candidateLimit;index++){
          const candidate={schemaVersion:1,candidateId:`CANDIDATE:${worldId}:${anchor.word}:${String(results.length+1).padStart(3,"0")}`,worldId,anchorTermId:anchor.id,anchorWord:anchor.word,wheelLetters,answers,requiredWords:words,layout:layouts[index].placements,layoutMetrics:layouts[index].metrics,alternativeLayoutCount:layouts.length,rewardPolicy:{financial:{coinsPerLetter:7,xpPerLetter:1.5,roundXp:true},ordinary:{coinsPerWord:1,xp:0},bonus:{coins:0,xp:0}},approvalStatus:"pending-owner-review",search:{combinationsExamined:examined,layoutIndex:index+1}};
          const ordinaryByWord=new Map(ordinaryPool.map(item=>[item.word,item])),validation=validateCandidate(candidate,{...deps,ordinaryByWord}),ranking=rankCandidate(candidate,validation,options);results.push({...candidate,validation,ranking});
        }
        if(results.length>=candidateLimit)break;
      }
      if(results.length>=candidateLimit||examined>=combinationLimit)break;
    }
    return {anchor,examined,candidates:results.sort((a,b)=>(b.ranking.score||-1)-(a.ranking.score||-1)||a.candidateId.localeCompare(b.candidateId))};
  }

  function renderGrid(candidate){
    const cells=new Map();let maxR=0,maxC=0;for(const item of candidate.layout||[])for(let i=0;i<item.word.length;i++){const r=item.r+(item.dir==="v"?i:0),c=item.c+(item.dir==="h"?i:0);cells.set(`${r},${c}`,item.word[i]);maxR=Math.max(maxR,r);maxC=Math.max(maxC,c)}
    return Array.from({length:maxR+1},(_,r)=>Array.from({length:maxC+1},(_,c)=>cells.get(`${r},${c}`)||"·").join(" ")).join("\n");
  }
  function reviewMarkdown(candidate){
    const financial=candidate.answers.filter(answer=>answer.category.startsWith("financial-")).map(answer=>`- ${answer.word} — ${answer.termId} (${answer.worldId})`).join("\n"),ordinary=candidate.answers.filter(answer=>answer.category==="ordinary").map(answer=>`- ${answer.word} — ${answer.supportApproval}`).join("\n")||"- None",failures=candidate.validation.failures.length?candidate.validation.failures.map(item=>`- FAIL · ${item.rule}${item.words.length?` · ${item.words.join(", ")}`:""}: ${item.explanation}`).join("\n"):"- PASS · All mandatory validation categories",factors=Object.entries(candidate.ranking.factors||{}).map(([name,value])=>`- ${name}: ${value}`).join("\n")||"- Not ranked";
    return `# Crossword Candidate Review\n\n- Candidate: ${candidate.candidateId}\n- World: ${candidate.worldId}\n- Anchor: ${candidate.anchorWord} (${candidate.anchorTermId})\n- Approval status: ${candidate.approvalStatus}\n- Validation: **${candidate.validation.status}**\n- Ranking: ${candidate.ranking.score===null?"WITHHELD":`${candidate.ranking.score}/100`}\n\n## Required financial words\n\n${financial}\n\n## Ordinary supporting words\n\n${ordinary}\n\n## Crossword preview\n\n\`\`\`text\n${renderGrid(candidate)}\n\`\`\`\n\n## Validation results\n\n${failures}\n\n## Ranking explanation\n\n${factors}\n\n${(candidate.ranking.explanation||[]).map(line=>`- ${line}`).join("\n")}\n`;
  }

  function exportApprovedCandidate(candidate,options={},deps={}){
    if(candidate.approvalStatus!=="owner-approved")throw new Error("Candidate export requires approvalStatus 'owner-approved'.");
    if(!deps.registry||!deps.validateCrosswordLayoutFn)throw new Error("Candidate export requires authoritative registry and strict validator dependencies.");
    const ordinaryByWord=deps.ordinaryByWord||new Map((candidate.answers||[]).filter(answer=>answer.category==="ordinary").map(answer=>[answer.word,{word:answer.word,approvalStatus:answer.supportApproval}])),freshValidation=validateCandidate(candidate,{...deps,ordinaryByWord});
    if(freshValidation.status!=="PASS")throw new Error(`Candidate export failed fresh validation: ${freshValidation.failures.map(item=>item.rule).join(", ")}`);
    const revision=Number.isInteger(options.revision)?options.revision:1;
    return {id:`FQ-V3:${candidate.worldId}:${candidate.anchorWord}:R${revision}`,worldId:candidate.worldId,puzzleVersion:3,puzzleMode:"v3",contentRevision:revision,contentStatus:"owner-approved",sourceReviewId:candidate.candidateId,anchorWord:candidate.anchorWord,anchorTermId:candidate.anchorTermId,wheelLetters:[...candidate.wheelLetters],answers:candidate.answers.map(item=>({...item})),bonusWords:[],requiredWords:[...candidate.requiredWords],layout:candidate.layout.map(item=>({...item})),rewardPolicy:JSON.parse(JSON.stringify(candidate.rewardPolicy))};
  }

  return {FINANCIAL_MINIMUM,normalizeWord,counts,canForm,canonicalLayout,layoutMetrics,enumerateLayouts,createRegistry,financialAnswer,ordinaryAnswer,validateCandidate,rankCandidate,generateCandidates,renderGrid,reviewMarkdown,exportApprovedCandidate};
});
