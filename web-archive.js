(() => {
const $ = (id) => document.getElementById(id);
const urlTab=$("urlTab"), filesTab=$("filesTab"), urlPane=$("urlPane"), filesPane=$("filesPane");
const statusText=$("statusText"), logBox=$("log"), progressBar=$("progressBar"), startBtn=$("startBtn");
function say(message){statusText.textContent=message}
function log(message){logBox.textContent += (logBox.textContent?"\n":"")+message;logBox.scrollTop=logBox.scrollHeight}
function progress(n){progressBar.style.width=Math.max(0,Math.min(100,n))+"%"}
function switchTab(which){const url=which==="url";urlPane.classList.toggle("hidden",!url);filesPane.classList.toggle("hidden",url);urlTab.classList.toggle("active",url);filesTab.classList.toggle("active",!url)}
urlTab.addEventListener("click",()=>switchTab("url"));filesTab.addEventListener("click",()=>switchTab("files"));
function safeName(s){return (s||"site").replace(/^https?:\/\//,"").replace(/[^a-z0-9._-]+/gi,"_").replace(/^_+|_+$/g,"").slice(0,70)||"site"}
function saveBlob(blob,name){const a=document.createElement("a"),u=URL.createObjectURL(blob);a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000)}
function validUrl(value){const u=new URL(value);if(!["http:","https:"].includes(u.protocol))throw new Error("Use an http:// or https:// website address.");return u}
async function viaRelay(url){const endpoint="https://api.allorigins.win/raw?url="+encodeURIComponent(url);const res=await fetch(endpoint,{signal:AbortSignal.timeout(20000)});if(!res.ok)throw new Error("Relay returned HTTP "+res.status);return res}
async function buildSiteZip(){
 const url=validUrl($("siteUrl").value.trim());if(!window.JSZip)throw new Error("ZIP library did not load. Check your connection and refresh.");
 startBtn.disabled=true;logBox.textContent="";progress(2);say("Trying to read "+url.hostname+"…");
 const zip=new JSZip(),folder=zip.folder(safeName(url.hostname));let count=0;
 const response=await viaRelay(url.href);const html=await response.text();if(!html.trim())throw new Error("The relay returned an empty page.");
 folder.file("index.html",html);count++;log("Saved page HTML");
 if($("includeAssets").checked){
  const doc=new DOMParser().parseFromString(html,"text/html");
  const assets=new Map();
  for(const el of doc.querySelectorAll("script[src],link[rel~='stylesheet'][href],img[src],source[src],video[src],audio[src],iframe[src]")){
   const raw=el.getAttribute("src")||el.getAttribute("href");if(!raw)continue;
   try{const abs=new URL(raw,url.href);if(abs.protocol.startsWith("http"))assets.set(abs.href,abs.pathname.split("/").pop()||"asset-"+(assets.size+1))}catch{}
  }
  for(const el of doc.querySelectorAll("img[srcset],source[srcset]")){for(const candidate of (el.getAttribute("srcset")||"").split(",")){const raw=candidate.trim().split(/\s+/)[0];try{const abs=new URL(raw,url.href);assets.set(abs.href,abs.pathname.split("/").pop()||"asset-"+(assets.size+1))}catch{}}}
  const limit=Number($("assetLimit").value),items=[...assets.entries()].slice(0,limit);let i=0;
  for(const [assetUrl,filename] of items){i++;try{const r=await viaRelay(assetUrl);if(!r.ok)throw new Error("HTTP "+r.status);const blob=await r.blob();const path=new URL(assetUrl).pathname;const ext=(path.match(/\.[a-z0-9]{1,8}$/i)||[])[0]||"";folder.file("assets/"+String(i).padStart(3,"0")+"-"+safeName(filename)+(ext&&!filename.endsWith(ext)?"":""),blob);count++;log("✓ "+new URL(assetUrl).hostname+path.slice(-55));}catch(e){log("× Skipped "+assetUrl+" — "+e.message)}progress(5+Math.round(i/Math.max(1,items.length)*75))}
 }
 say("Creating ZIP…");progress(90);const blob=await zip.generateAsync({type:"blob"});saveBlob(blob,safeName(url.hostname)+"-archive.zip");progress(100);say("ZIP downloaded — "+count+" file(s) included.");log("Done. Note: linked asset paths in the HTML may need manual adjustment to work offline.");
}
async function zipLocalFiles(){
 const files=[...$("fileInput").files];if(!files.length)throw new Error("Choose at least one file or folder first.");if(!window.JSZip)throw new Error("ZIP library did not load. Check your connection and refresh.");
 const zip=new JSZip();for(let i=0;i<files.length;i++){const f=files[i];const name=f.webkitRelativePath||f.name;zip.file(name,f);progress((i+1)/files.length*75);say("Adding "+name)}say("Creating ZIP…");const blob=await zip.generateAsync({type:"blob"});saveBlob(blob,"web-archive-files.zip");progress(100);say("ZIP downloaded — "+files.length+" file(s) included.");logBox.textContent="All selected files were zipped locally. Nothing was uploaded.";
}
async function run(fn,button){button.disabled=true;logBox.textContent="";progress(0);try{await fn()}catch(e){say("Could not finish: "+e.message);log("Tip: try the extension for a page open in Chrome, or use Local files mode.");}finally{startBtn.disabled=false;$("zipFilesBtn").disabled=false}}
startBtn.addEventListener("click",()=>run(buildSiteZip,startBtn));$("zipFilesBtn").addEventListener("click",()=>run(zipLocalFiles,$("zipFilesBtn")));
$("siteUrl").addEventListener("keydown",e=>{if(e.key==="Enter")startBtn.click()});
})();