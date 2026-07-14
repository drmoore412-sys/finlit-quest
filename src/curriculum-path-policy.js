(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("node:path"):null);if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitCurriculumPathPolicy=api})(typeof globalThis!=="undefined"?globalThis:this,function(path){
  "use strict";
  function isInside(parent,candidate){const relative=path.relative(parent,candidate);return relative!==""&&!relative.startsWith("..")&&!path.isAbsolute(relative)}
  function approvedPaths(mapPath,world,version){const approvedDir=path.dirname(path.resolve(mapPath)),worldDir=path.dirname(approvedDir),expectedWorld=path.basename(worldDir);if(path.basename(approvedDir)!=="approved")throw new Error("The import map must be stored in curriculum/<world>/approved/.");if(expectedWorld!==world)throw new Error(`Import map world '${world}' does not match directory '${expectedWorld}'.`);return {approvedDir,workbooksDir:path.join(approvedDir,"workbooks"),runtimeDir:path.join(approvedDir,"runtime"),reportsDir:path.join(approvedDir,"reports"),runtimeFile:path.join(approvedDir,"runtime",`${world}-curriculum-v${version}.json`)}}
  function assertWorkbookPath(workbooksDir,candidate){const resolved=path.resolve(candidate);if(!isInside(path.resolve(workbooksDir),resolved))throw new Error(`Workbook source must be inside ${workbooksDir}.`);return resolved}
  return {isInside,approvedPaths,assertWorkbookPath};
});
