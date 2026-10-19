(function(root,factory){
  const value=factory();
  if(typeof module==="object"&&module.exports)module.exports=value;
  root.FINLIT_WORLD_DEFINITIONS_2027=value;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  return Object.freeze({
    schemaVersion:1,
    decisionDate:"2026-10-18",
    runtimeIntegrationStatus:"thirteen-worlds-playable",
    worlds:Object.freeze([
      {id:"moneybasics",name:"Money Basics",order:1,currentRuntimeStatus:"playable",implementedPuzzleCount:15},
      {id:"credit",name:"Credit Foundations",order:2,currentRuntimeStatus:"playable",implementedPuzzleCount:15},
      {id:"crypto",name:"Crypto Foundations",order:3,currentRuntimeStatus:"playable",implementedPuzzleCount:15},
      {id:"banking",name:"Banking Basics",order:4,currentRuntimeStatus:"playable",implementedPuzzleCount:15},
      {id:"investing",name:"Investing Basics",order:5,currentRuntimeStatus:"playable",implementedPuzzleCount:15},
      {id:"coins",name:"Coins & Currency",order:6,currentRuntimeStatus:"playable",implementedPuzzleCount:15},
      {id:"ai_technology",name:"AI & Technology",order:7,currentRuntimeStatus:"playable",implementedPuzzleCount:15},
      {id:"real_estate",name:"Real Estate",order:8,currentRuntimeStatus:"playable",implementedPuzzleCount:15},
      {id:"taxes",name:"Taxes",order:9,currentRuntimeStatus:"playable",implementedPuzzleCount:15},
      {id:"insurance",name:"Insurance & Protection",order:10,currentRuntimeStatus:"playable",implementedPuzzleCount:15},
      {id:"business",name:"Business & Entrepreneurship",order:11,currentRuntimeStatus:"playable",implementedPuzzleCount:15},
      {id:"social_media",name:"Social Media & Digital Income",order:12,currentRuntimeStatus:"playable",implementedPuzzleCount:15},
      {id:"retirement",name:"Retirement & Wealth Planning",order:13,currentRuntimeStatus:"playable",implementedPuzzleCount:15},
    ].map(Object.freeze)),
  });
});
