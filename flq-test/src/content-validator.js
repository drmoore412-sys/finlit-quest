(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitContentValidator=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const DIFFICULTIES=new Set(["beginner","intermediate","advanced","expert","master","review"]);
  const CATEGORIES=new Set(["digital_assets","network_infrastructure","network_governance","network_security","token_mechanics","transactions","defi","security"]);
  const CHALLENGE_TYPES=new Set(["multiple_choice","scenario_choice","true_false","identify_best_example","identify_common_mistake","compare_choices"]);
  const REQUIRED_TEXT=["id","word","normalizedWord","world","category","difficulty","definition","pronunciation","realLifeExample","didYouKnow","commonMistake"];
  function canForm(word,letters){const available=[...letters];return [...word].every(letter=>{const index=available.indexOf(letter);if(index<0)return false;available.splice(index,1);return true})}
  function validateWorld(world,terms){
    const errors=[],termIds=new Set(),normalizedWords=new Set(),words=new Set();
    if(!world||typeof world!=="object")return {valid:false,errors:["World manifest must be an object."]};
    ["id","name","eyebrow"].forEach(field=>{if(!String(world[field]||"").trim())errors.push(`World field '${field}' is required.`)});
    if(!Array.isArray(terms)||!terms.length)errors.push("World must contain at least one educational term.");
    (terms||[]).forEach((term,index)=>{
      const path=`terms[${index}]`;
      REQUIRED_TEXT.forEach(field=>{if(!String(term?.[field]||"").trim())errors.push(`${path}.${field} must be non-empty.`)});
      if(term?.world!==world.id)errors.push(`${path}.world '${term?.world}' must match world id '${world.id}'.`);
      if(termIds.has(term?.id))errors.push(`Duplicate term id '${term.id}'.`);termIds.add(term?.id);
      if(normalizedWords.has(term?.normalizedWord))errors.push(`Duplicate normalized word '${term.normalizedWord}'.`);normalizedWords.add(term?.normalizedWord);
      if(term?.normalizedWord!==String(term?.word||"").toLowerCase())errors.push(`${path}.normalizedWord must equal the lowercase word.`);
      words.add(term?.word);
      if(!CATEGORIES.has(term?.category))errors.push(`${path}.category '${term?.category}' is invalid.`);
      if(!DIFFICULTIES.has(term?.difficulty))errors.push(`${path}.difficulty '${term?.difficulty}' is invalid.`);
      if(!Number.isFinite(term?.xpValue)||term.xpValue<=0)errors.push(`${path}.xpValue must be a positive number.`);
      if(!Number.isFinite(term?.reviewWeight)||term.reviewWeight<=0)errors.push(`${path}.reviewWeight must be a positive number.`);
      if(!Array.isArray(term?.relatedTermIds))errors.push(`${path}.relatedTermIds must be an array.`);
      const challenge=term?.quickChallenge;
      if(!challenge||typeof challenge!=="object")errors.push(`${path}.quickChallenge is required.`);
      else {
        ["id","type","prompt","explanation","difficulty","relatedTermId"].forEach(field=>{if(!String(challenge[field]||"").trim())errors.push(`${path}.quickChallenge.${field} must be non-empty.`)});
        if(!CHALLENGE_TYPES.has(challenge.type))errors.push(`${path}.quickChallenge.type '${challenge.type}' is invalid.`);
        if(!DIFFICULTIES.has(challenge.difficulty))errors.push(`${path}.quickChallenge.difficulty '${challenge.difficulty}' is invalid.`);
        if(!Array.isArray(challenge.options)||challenge.options.length<2||challenge.options.some(option=>!String(option||"").trim()))errors.push(`${path}.quickChallenge.options must contain at least two non-empty choices.`);
        if(!Number.isInteger(challenge.correctAnswer)||challenge.correctAnswer<0||challenge.correctAnswer>=(challenge.options?.length||0))errors.push(`${path}.quickChallenge.correctAnswer must be a valid option index.`);
      }
    });
    (terms||[]).forEach(term=>{(term.relatedTermIds||[]).forEach(id=>{if(!termIds.has(id))errors.push(`Term '${term.id}' references unknown related term '${id}'.`)});if(term.quickChallenge?.relatedTermId&&!termIds.has(term.quickChallenge.relatedTermId))errors.push(`Challenge '${term.quickChallenge.id}' references unknown term '${term.quickChallenge.relatedTermId}'.`)});
    if(!Array.isArray(world.levels)||!world.levels.length)errors.push("World must contain at least one level.");
    const levelIds=new Set();(world.levels||[]).forEach((level,index)=>{const path=`levels[${index}]`;if(!level.id)errors.push(`${path}.id is required.`);if(levelIds.has(level.id))errors.push(`Duplicate level id '${level.id}'.`);levelIds.add(level.id);if(!DIFFICULTIES.has(level.difficulty))errors.push(`${path}.difficulty '${level.difficulty}' is invalid.`);if(!String(level.letters||"").trim())errors.push(`${path}.letters is required.`);if(!Array.isArray(level.words)||!level.words.length)errors.push(`${path}.words must be non-empty.`);(level.words||[]).forEach(word=>{if(!words.has(word))errors.push(`Level '${level.id}' references unknown word '${word}'.`);else if(!canForm(word,level.letters||""))errors.push(`Level '${level.id}' cannot form target word '${word}' from letters '${level.letters}'.`)})});
    (world.bonusWords||[]).forEach(word=>{if(!words.has(word))errors.push(`Bonus list references unknown word '${word}'.`)});
    if(!world.reward||!Number.isFinite(world.reward.multiplier)||world.reward.multiplier<=0)errors.push("World reward.multiplier must be positive.");
    return {valid:errors.length===0,errors};
  }
  function assertValidWorld(world,terms){const result=validateWorld(world,terms);if(!result.valid)throw new Error(`Invalid FinLit world:\n- ${result.errors.join("\n- ")}`);return true}
  return {validateWorld,assertValidWorld,DIFFICULTIES:[...DIFFICULTIES],CATEGORIES:[...CATEGORIES],CHALLENGE_TYPES:[...CHALLENGE_TYPES]};
});
