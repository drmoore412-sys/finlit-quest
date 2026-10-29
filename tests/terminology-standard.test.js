const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),os=require("node:os"),path=require("node:path"),cp=require("node:child_process");
const {ROOT}=require("./helpers.js"),ts=require("../src/terminology-standard.js");
const rules=ts.compile(ts.loadStandard()),scan=(text,opts)=>ts.scanText(text,rules,opts);
const terms=found=>found.map(f=>f.term);

test("known prohibited invented provider names are detected, including short forms and the rejected replacement names",()=>{
  for(const name of ["Harbor Vault","Keystone Loans","Apex Yield","Surge Pool","Ostrel Vault","Varnwick Loans","Kelvane Yield","Mirrowl Pool"]){
    const found=scan(`You put $400 in ${name} this month.`);
    assert.ok(found.some(f=>f.kind==="prohibited"),name);
  }
  assert.deepEqual(terms(scan("Keystone sells the ETH if the loan reaches 80%.")),["Keystone"]);
  assert.equal(scan("Keystone sells the ETH.")[0].replacement,"the lending protocol");
});

test("legitimate generic terminology, real institutions, statutes, character names and idioms are accepted",()=>{
  const ok=[
    "A DeFi yield vault is a crypto service that pays a variable rate. It is not FDIC-insured.",
    "A crypto-backed lending protocol accepts crypto as collateral, the asset you pledge to back a loan.",
    "A DeFi liquidity pool is a shared pot of crypto that traders swap against.",
    "The stablecoin yield vault announces a $2,000-per-week withdrawal limit.",
    "The Federal Deposit Insurance Corporation insures bank deposits up to $250,000.",
    "The Fair Credit Reporting Act is a federal law governing credit reports.",
    "The Equal Credit Opportunity Act prohibits credit discrimination.",
    "Annual Percentage Yield (APY) includes compounding.",
    "A safe harbor is a provision that protects you from penalty if you follow its rules.",
    "Building a keystone habit, such as paying every bill on time, supports your credit.",
    "Zoe Williams checks her savings account balance. Maya Chen asks about a Roth IRA.",
    "Credit cards, savings accounts and money market accounts differ.",
  ];
  for(const text of ok)assert.deepEqual(scan(text),[],text);
});

test("labeled simulation descriptions are not rejected, but a known prohibited name is rejected even when labeled",()=>{
  assert.deepEqual(scan("In this story, the lending protocol charges 9% simple interest. These rates are simulation assumptions."),[]);
  assert.deepEqual(scan("For example, Westbrook Savings is a simulated bank used in this game."),[]);
  const labeled=scan("Harbor Vault (fictional) pays 8%.");
  assert.ok(labeled.some(f=>f.kind==="prohibited"));
});

test("heuristics flag suspected invented names for human review (a review aid, not proof)",()=>{
  assert.ok(scan("You deposit $500 with Nexora Lending to earn 6%.").some(f=>f.kind==="suspect"&&/Nexora Lending/.test(f.term)));
  assert.ok(scan("Open an account at Bluepeak Savings today.").some(f=>f.kind==="suspect"));
  assert.ok(scan("A coworker shows you Zentrix (a fictional lender).").some(f=>f.rule==="fictional-provider-label"));
  assert.ok(scan("Statements come from Orvane Capital Inc. each month.").some(f=>f.rule==="company-legal-suffix"));
  // Honest limit: a bare invented brand with no provider noun and no label is not detectable by these rules.
  assert.deepEqual(scan("You put $400 into Zentrix."),[]);
});

test("ledger lookups and non-player fields are ignored, but feedback text and option text are scanned",()=>{
  assert.deepEqual(scan('about {row(5,"Keystone interest","KLP")} in the first month'),[]);
  const doc={questions:[{situation:"Plain text",options:{a:{t:"Deposit in Harbor Vault."}},feedback:{a:[{text:"You used Apex Yield.",ref:"Keystone",dk:"Surge Pool",assert:"x",dev:"Harbor Vault replaced"}]}}],wording_fixes:[{from:"Harbor Vault"}]};
  const found=ts.scanValue(doc,"fixture.json",rules);
  assert.deepEqual(found.map(f=>f.location).sort(),["questions[0].feedback.a[0].text","questions[0].options.a.t"]);
  assert.ok(found.every(f=>f.file==="fixture.json"&&f.term&&f.kind));
});

test("findings report the file, location and suspicious term",()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"flq-term-"));
  fs.mkdirSync(path.join(dir,"content"));
  fs.writeFileSync(path.join(dir,"content","demo-terms.json"),JSON.stringify([{id:"demo.apr",definition:"Compare offers from Keystone Loans."}]));
  const {findings}=ts.scanRepo(dir);
  assert.equal(findings.length>=1,true);
  assert.equal(findings[0].file,"content/demo-terms.json");
  assert.equal(findings[0].location,"[0].definition");
  assert.equal(findings[0].term,"Keystone Loans");
  const run=cp.spawnSync(process.execPath,[path.join(ROOT,"scripts","check-terminology.js"),"--root",dir],{encoding:"utf8"});
  assert.equal(run.status,1);
  assert.match(run.stdout,/content\/demo-terms\.json :: \[0\]\.definition :: "Keystone Loans"/);
});

test("the maintainable data file is well-formed: every reviewed entry has a reason and no name is owner-authorized by default",()=>{
  const std=ts.loadStandard();
  assert.ok(std.prohibited.length>=4);
  for(const p of std.prohibited)assert.ok(p.term&&p.added,p.term);
  for(const r of std.reviewed)assert.ok(r.term&&r.reason&&r.added,r.term);
  assert.deepEqual(std.authorized,[]);
});

test("all player-facing curriculum in every world passes the strict terminology check (DeFi runtime, workbooks, term content, credit runtime)",()=>{
  const {findings,scanned}=ts.scanRepo(ROOT);
  const rel=file=>scanned.filter(f=>f.includes(file));
  assert.equal(rel("defi-real-life/approved/runtime/").filter(f=>f.endsWith(".tree.v1.json")).length,6);
  assert.equal(rel("defi-real-life/approved/workbooks/").length,6);
  assert.ok(scanned.some(f=>f.startsWith("content/")));
  assert.ok(scanned.some(f=>f.includes("credit/approved/runtime")));
  assert.deepEqual(findings.map(f=>`${f.file} :: ${f.location} :: ${f.term}`),[]);
  assert.equal(ts.summarize(findings,true).pass,true);
});

test("the DeFi in Real Life runtime has six profiles, 42 questions and no invented names in any player string",()=>{
  const dir=path.join(ROOT,"curriculum","defi-real-life","approved","runtime"),manifest=JSON.parse(fs.readFileSync(path.join(dir,"manifest.json"),"utf8"));
  assert.equal(manifest.journeys.length,6);
  let questions=0;
  for(const j of manifest.journeys){
    const tree=JSON.parse(fs.readFileSync(path.join(dir,j.file),"utf8"));
    questions+=tree.Q.length;
    assert.equal(tree.Q.length,7,j.slug);
    assert.equal(tree.S.some(s=>typeof s==="string"&&/Harbor|Keystone|Apex Yield|Surge Pool/.test(s)),false,j.slug);
  }
  assert.equal(questions,42);
});

test("the permanent Educational Terminology Standard is present in the authoritative project instructions",()=>{
  const claude=fs.readFileSync(path.join(ROOT,"CLAUDE.md"),"utf8");
  assert.match(claude,/FINLIT QUEST EDUCATIONAL TERMINOLOGY STANDARD/);
  assert.match(claude,/Never invent financial provider, platform, protocol, or product names/);
  assert.match(claude,/scripts\/check-terminology\.js/);
});
