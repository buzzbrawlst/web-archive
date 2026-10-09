(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const ui = {
    urlTab:$("urlTab"), filesTab:$("filesTab"), urlPane:$("urlPane"), filesPane:$("filesPane"),
    status:$("statusText"), log:$("log"), progress:$("progressBar"),
    start:$("startBtn"), zipFiles:$("zipFilesBtn"), input:$("siteUrl"), fileInput:$("fileInput")
  };
  const state = { busy:false };
  function say(message){ ui.status.textContent = message; }
  function log(message){ ui.log.textContent += (ui.log.textContent ? "\n" : "") + message; ui.log.scrollTop = ui.log.scrollHeight; }
  function progress(value){ ui.progress.style.width = Math.max(0,Math.min(100,value)) + "%"; }
  function switchTab(which){
    const url = which === "url";
    ui.urlPane.classList.toggle("hidden",!url);
    ui.filesPane.classList.toggle("hidden",url);
    ui.urlTab.classList.toggle("active",url);
    ui.filesTab.classList.toggle("active",!url);
  }
  ui.urlTab.addEventListener("click",()=>switchTab("url"));
  ui.filesTab.addEventListener("click",()=>switchTab("files"));

  function safeName(value){
    return String(value || "archive").normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-z0-9._-]+/gi,"_").replace(/^[_\.]+|[_\.]+$/g,"").slice(0,70) || "archive";
  }
  function validUrl(value){
    let url;
    try { url = new URL(value); } catch { throw new Error("Enter a complete website address, e.g. https://example.com"); }
    if (!["http:","https:"].includes(url.protocol)) throw new Error("Only public HTTP or HTTPS addresses are supported.");
    if (url.username || url.password) throw new Error("Remove any username or password from the URL.");
    return url;
  }
  function saveBlob(blob,name){
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=objectUrl; a.download=name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(objectUrl),60000);
  }
  function relayUrls(target, textOnly){
    const encoded = encodeURIComponent(target);
    const list = ["https://api.allorigins.win/raw?url="+encoded];
    if (textOnly) list.push("https://proxy.cors.dev/raw?url="+encoded);
    return list;
  }
  async function fetchPublic(target, textOnly=false){
    let lastError;
    for (const endpoint of relayUrls(target,textOnly)){
      try{
        const response = await fetch(endpoint,{signal:AbortSignal.timeout(18000),cache:"no-store"});
        if(!response.ok) throw new Error("relay returned HTTP "+response.status);
        const blob = await response.blob();
        if(!blob.size) throw new Error("relay returned an empty response");
        if(textOnly){
          const text = await blob.text();
          if (/^(?:Bad Gateway|Forbidden|Access denied|Cloudflare error)/i.test(text.trim())) throw new Error("relay returned an error page");
          return {text,contentType:response.headers.get("content-type")||""};
        }
        return {blob,contentType:response.headers.get("content-type")||""};
      }catch(error){ lastError=error; }
    }
    throw new Error((lastError && lastError.message || "request failed")+"; the site or public relay may block this request");
  }
  function assetFilename(url,index){
    let base;
    try { base = decodeURIComponent(new URL(url).pathname.split("/").filter(Boolean).pop() || "resource"); }
    catch { base="resource"; }
    base = safeName(base);
    if(!/\.[a-z0-9]{1,10}$/i.test(base)) {
      const type = (url.match(/\.(css|js|mjs|png|jpe?g|gif|webp|svg|woff2?|ttf|otf|mp4|webm)(?:[?#]|$)/i)||[])[1];
      if(type) base += "."+type;
    }
    return String(index).padStart(3,"0")+"-"+base;
  }
  function isFetchable(url){ return /^https?:$/.test(new URL(url).protocol); }
  function parseSrcset(value,base){
    return value.split(",").map(item=>{
      const bits=item.trim().split(/\s+/); if(!bits[0]) return null;
      try { return {url:new URL(bits[0],base).href, descriptor:bits.slice(1).join(" ")}; } catch { return null; }
    }).filter(Boolean);
  }
  async function buildSiteZip(){
    if(!window.JSZip) throw new Error("ZIP engine failed to load. Refresh with an internet connection and try again.");
    const target = validUrl(ui.input.value.trim());
    const limit = Number($("assetLimit").value) || 50;
    const zip = new JSZip();
    const rootName = safeName(target.hostname);
    const folder = zip.folder(rootName);
    const resources = new Map();
    const assetPaths = new Map();
    let saved = 0, attempted = 0, skipped = 0;
    ui.log.textContent="";
    say("Connecting to "+target.hostname+"…");
    log("This tool can only fetch public resources that the relay can access.");
    log("Do not use private URLs, login links, or URLs containing secrets.");
    progress(2);

    const pageResult = await fetchPublic(target.href,true);
    const parser = new DOMParser();
    const doc = parser.parseFromString(pageResult.text,"text/html");
    if(!doc.documentElement) throw new Error("The returned content does not look like an HTML page.");
    const queue = [];
    const seen = new Set();
    function queueResource(raw,kind,base){
      if(!raw || /^(?:data:|blob:|javascript:|mailto:|tel:|#)/i.test(raw.trim())) return;
      try{
        const url = new URL(raw,base || target.href);
        if(!isFetchable(url.href) || url.origin==="null") return;
        url.hash="";
        if(seen.has(url.href)) return;
        seen.add(url.href);
        if(queue.length>=limit) return;
        const path = "assets/"+assetFilename(url.href,queue.length+1);
        const item={url:url.href,kind,path};
        queue.push(item); resources.set(url.href,item);
      }catch{}
    }
    if($("includeAssets").checked){
      doc.querySelectorAll("script[src],img[src],source[src],video[src],audio[src],iframe[src],input[type=image][src],embed[src],track[src],link[href]").forEach(el=>{
        const tag=el.tagName.toLowerCase();
        const rel=(el.getAttribute("rel")||"").toLowerCase();
        const raw=tag==="link" ? el.getAttribute("href") : el.getAttribute("src");
        let kind="binary";
        if(tag==="link" && (rel.includes("stylesheet") || rel.includes("modulepreload") || rel.includes("preload"))) kind=rel.includes("stylesheet")?"css":"binary";
        if(/\.css(?:[?#]|$)/i.test(raw||"")) kind="css";
        queueResource(raw,kind,target.href);
      });
      doc.querySelectorAll("[srcset]").forEach(el=>parseSrcset(el.getAttribute("srcset")||"",target.href).forEach(v=>queueResource(v.url,"binary",target.href)));
      doc.querySelectorAll("[style]").forEach(el=>{const style=el.getAttribute("style")||"";for(const match of style.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi))queueResource(match[2],"binary",target.href);});
    }
    log("Page HTML fetched. Found "+queue.length+" initial resource(s).");
    const maxDynamic = Math.max(limit,queue.length);
    for(let i=0;i<queue.length && attempted<maxDynamic;i++){
      const item=queue[i]; attempted++;
      try{
        if(item.kind==="css"){
          const result=await fetchPublic(item.url,true);
          item.text=result.text;
          item.contentType=result.contentType;
          folder.file(item.path,item.text);
          const cssBase=item.url;
          for(const match of item.text.matchAll(/@import\s+(?:url\()?\s*['"]?([^'"\s);]+)['"]?\s*\)?/gi)) queueResource(match[1],"css",cssBase);
          for(const match of item.text.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) queueResource(match[2],"binary",cssBase);
        }else{
          const result=await fetchPublic(item.url,false);
          folder.file(item.path,result.blob);
          item.contentType=result.contentType;
        }
        item.saved=true;saved++;
        log("✓ "+item.kind.toUpperCase()+" "+new URL(item.url).pathname.slice(-60));
      }catch(error){item.saved=false;skipped++;log("× Skipped "+item.url+" ("+error.message+")");}
      progress(5+Math.round(attempted/Math.max(1,maxDynamic)*68));
    }
    // Rewrite fetched HTML references to the local paths that actually made it into the ZIP.
    function localPath(raw,base=target.href){
      try{const url=new URL(raw,base);url.hash="";const item=resources.get(url.href);return item&&item.saved?item.path:null;}catch{return null;}
    }
    // Rewrite CSS URLs/imports to local sibling files so stylesheets can resolve
    // assets after extraction. CSS and its downloaded assets are both stored in /assets.
    for (const item of queue) {
      if (item.kind !== "css" || !item.saved || typeof item.text !== "string") continue;
      const cssBase = item.url;
      const rewriteCssUrl = (raw) => {
        try {
          const path = localPath(raw, cssBase);
          return path && resources.get(new URL(raw, cssBase).href)?.saved ? path.split("/").pop() : raw;
        } catch { return raw; }
      };
      item.text = item.text.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (whole, quote, raw) => {
        const trimmed = raw.trim();
        if (!trimmed || /^(?:data:|blob:|#)/i.test(trimmed)) return whole;
        const replacement = rewriteCssUrl(trimmed);
        return replacement === trimmed ? whole : "url(" + quote + replacement + quote + ")";
      });
      item.text = item.text.replace(/(@import\s+(?:url\()?\s*['"]?)([^'")\s;]+)(['"]?\s*\)?\s*;?)/gi, (whole, before, raw, after) => {
        if (/^(?:data:|blob:|#)/i.test(raw)) return whole;
        const replacement = rewriteCssUrl(raw);
        return replacement === raw ? whole : before + replacement + after;
      });
      folder.file(item.path, item.text);
    }
    if($("includeAssets").checked){
      doc.querySelectorAll("script[src],img[src],source[src],video[src],audio[src],iframe[src],input[type=image][src],embed[src],track[src],link[href]").forEach(el=>{
        const tag=el.tagName.toLowerCase(),attr=tag==="link"?"href":"src",raw=el.getAttribute(attr);
        const path=raw&&localPath(raw,target.href);
        if(path) el.setAttribute(attr,path);
        else if(raw && /^https?:/i.test(raw)) el.setAttribute("data-archive-original-"+attr,raw);
        el.removeAttribute("integrity");el.removeAttribute("crossorigin");
      });
      doc.querySelectorAll("[srcset]").forEach(el=>{
        const rewritten=parseSrcset(el.getAttribute("srcset")||"",target.href).map(v=>({path:localPath(v.url,target.href),descriptor:v.descriptor,original:v.url}));
        const successful=rewritten.filter(v=>v.path);
        if(successful.length)el.setAttribute("srcset",successful.map(v=>v.path+(v.descriptor?" "+v.descriptor:"")).join(", "));
      });
      // Store a manifest so users can see exactly what was and was not captured.
    }
    doc.querySelectorAll("base").forEach(el=>el.remove());
    doc.querySelectorAll('meta[http-equiv="Content-Security-Policy" i]').forEach(el=>el.remove());
    folder.file("index.html","<!doctype html>\n"+doc.documentElement.outerHTML);
    const manifest={
      source:target.href,createdAt:new Date().toISOString(),
      note:"Best-effort browser archive. Server-side code, authenticated content, blocked files and dynamic backend behavior are not included.",
      html:"index.html",resources:queue.map(item=>({url:item.url,path:item.path,kind:item.kind,saved:!!item.saved,contentType:item.contentType||""}))
    };
    folder.file("archive-manifest.json",JSON.stringify(manifest,null,2));
    progress(82);say("Building ZIP archive…");
    const blob=await zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:5}},metadata=>progress(82+Math.round(metadata.percent*.17)));
    saveBlob(blob,rootName+"-web-archive.zip");
    progress(100);say("ZIP downloaded: "+(saved+1)+" file(s) saved.");
    log("Saved "+saved+" asset(s); skipped "+skipped+".");
    log("Open "+rootName+"/index.html from the ZIP to inspect the captured page.");
    log("Some sites need live services, cookies, JavaScript APIs or paths that cannot be archived, so offline fidelity varies.");
  }
  async function zipLocalFiles(){
    if(!window.JSZip) throw new Error("ZIP engine failed to load. Refresh with an internet connection and try again.");
    const files=Array.from(ui.fileInput.files||[]);
    if(!files.length) throw new Error("Choose files or a folder first.");
    const zip=new JSZip();let total=0;
    for(let i=0;i<files.length;i++){
      const file=files[i];
      const path=(file.webkitRelativePath||file.name).replace(/^\/+/,"");
      zip.file(path,file);total+=file.size;
      say("Adding "+path);progress(Math.round((i+1)/files.length*75));
    }
    say("Building ZIP archive…");
    const blob=await zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:5}},metadata=>progress(75+Math.round(metadata.percent*.24)));
    saveBlob(blob,"web-archive-files.zip");progress(100);
    say("ZIP downloaded: "+files.length+" file(s).");
    logBox.textContent="Created locally from your selected files. No files were uploaded.";
  }
  async function run(task){
    if(state.busy)return;
    state.busy=true;ui.start.disabled=true;ui.zipFiles.disabled=true;ui.log.textContent="";progress(0);
    try{await task();}
    catch(error){say("Could not finish: "+(error&&error.message||String(error)));log("Try Local files mode if URL capture is blocked. URL capture depends on third-party relay availability and site permissions.");}
    finally{state.busy=false;ui.start.disabled=false;ui.zipFiles.disabled=false;}
  }
  ui.start.addEventListener("click",()=>run(buildSiteZip));
  ui.zipFiles.addEventListener("click",()=>run(zipLocalFiles));
  ui.input.addEventListener("keydown",event=>{if(event.key==="Enter")ui.start.click();});
})();