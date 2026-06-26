import"./modulepreload-polyfill-B5Qt9EMX.js";import{a as w,c as x,o as E,b as K,d as Q,r as N,A as O,v as Y,i as C,s as T,e as Z}from"./auth-CAIh3L2-.js";import{g as S,s as _,a as ee,t as s}from"./index-C0bumzTF.js";import{S as R,f as v,r as te,a as ne,b as ae,c as j,d as re,e as oe}from"./tournament-CRQJLyvb.js";const H={en:{signIn:"Sign in",title:"Sign in to compete",phone:"Phone number",send:"Send code",sending:"Sending…",code:"Enter the 6-digit code",verify:"Verify",verifying:"Verifying…",resend:"Resend code",name:"Display name",save:"Save",signOut:"Sign out",sent:"Code sent. Check your SMS.",errSend:"Couldn't send the code. Check the number and try again.",errTimeout:"Network is slow or unreachable. Check your connection and try again.",errVerify:"Wrong or expired code.",close:"Close",demoCode:"Demo mode — your code is",promo:"Win weekly & monthly prizes"},am:{signIn:"ግባ",title:"ለመወዳደር ይግቡ",phone:"ስልክ ቁጥር",send:"ኮድ ላክ",sending:"በመላክ ላይ…",code:"6-አሃዝ ኮድ ያስገቡ",verify:"አረጋግጥ",verifying:"በማረጋገጥ ላይ…",resend:"ኮድ እንደገና ላክ",name:"የሚታይ ስም",save:"አስቀምጥ",signOut:"ውጣ",sent:"ኮድ ተልኳል። SMS ይመልከቱ (ወይም በፈተና ሁነታ የ function logs)።",errSend:"ኮዱን መላክ አልተቻለም። ቁጥሩን አረጋግጠው እንደገና ይሞክሩ።",errTimeout:"አውታረ መረቡ ቀርፋፋ ወይም አይገኝም። ግንኙነትዎን አረጋግጠው እንደገና ይሞክሩ።",errVerify:"የተሳሳተ ወይም ጊዜው ያለፈበት ኮድ።",close:"ዝጋ",demoCode:"የማሳያ ሁነታ — ኮድዎ",promo:"ሳምንታዊ እና ወርሃዊ ሽልማቶችን ያሸንፉ"}},r=e=>(H[S()]??H.en)[e],$=e=>e.replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]);let o=null,f,m="";function ie(){if(!w())return;V();const e=document.querySelector(".topbar");e&&(f=document.createElement("div"),f.className="auth-slot",e.insertBefore(f,e.querySelector("#settingsBtn")),h(),x().then(t=>{o=t,h()}),E(t=>{o=t,h()}))}function h(){if(!f)return;const e=o?`👤 ${$(o.name||o.phone)}`:r("signIn");f.innerHTML=`<button class="auth-btn">${e}</button>`,f.querySelector("button").addEventListener("click",o?U:F)}function q(e){var n;(n=document.querySelector(".auth-modal"))==null||n.remove();const t=document.createElement("div");return t.className="auth-modal",t.innerHTML=`
    <div class="auth-brand"><span class="auth-brand-icon">🎮</span><span>GoPlay</span></div>
    <button class="auth-back" aria-label="${r("close")}">✕</button>
    <div class="auth-stack">
      <div class="auth-promo">🎁 ${r("promo")}</div>
      <div class="auth-card">${e}</div>
    </div>`,document.body.appendChild(t),t.querySelector(".auth-back").addEventListener("click",()=>t.remove()),t}function D(){w()&&(V(),F())}function F(){const e=q(`
    <h3>${r("title")}</h3>
    <label>${r("phone")}</label>
    <input class="auth-input" id="phone" type="tel" inputmode="tel" placeholder="09… / +2519…" value="${$(m)}" />
    <p class="auth-err" id="err"></p>
    <button class="auth-primary" id="go">${r("send")}</button>`),t=e.querySelector("#phone"),n=e.querySelector("#go");t.focus(),n.addEventListener("click",async()=>{if(m=t.value.trim(),!!m){n.disabled=!0,n.textContent=r("sending");try{await N(m),se()}catch(a){e.querySelector("#err").textContent=r(a instanceof O?"errTimeout":"errSend"),n.disabled=!1,n.textContent=r("send")}}})}function se(){const e=q(`
    <h3>${r("code")}</h3>
    <p class="auth-hint">${r("sent")}</p>
    <p class="auth-demo" id="demo" hidden></p>
    <input class="auth-input" id="code" type="text" inputmode="numeric" maxlength="6" placeholder="123456" />
    <p class="auth-err" id="err"></p>
    <button class="auth-primary" id="go">${r("verify")}</button>
    <button class="auth-link" id="resend" disabled>${r("resend")} <span id="timer"></span></button>`),t=e.querySelector("#code"),n=e.querySelector("#go"),a=e.querySelector("#resend"),i=e.querySelector("#timer");t.focus(),I();let l=0,c;function B(){l=90,a.disabled=!0;const b=()=>{const k=String(l%60).padStart(2,"0");i.textContent=`(${Math.floor(l/60)}:${k})`,l<=0&&(c&&clearInterval(c),a.disabled=!1,i.textContent=""),l--};b(),c=setInterval(b,1e3)}B(),e.querySelector(".auth-back").addEventListener("click",()=>{c&&clearInterval(c)}),n.addEventListener("click",async()=>{const b=t.value.trim();if(!(b.length<4)){n.disabled=!0,n.textContent=r("verifying");try{o=await Y(m,b),c&&clearInterval(c),e.remove(),h(),o.name||U()}catch(k){e.querySelector("#err").textContent=r(k instanceof O?"errTimeout":"errVerify"),n.disabled=!1,n.textContent=r("verify")}}}),a.addEventListener("click",()=>{a.disabled||N(m).then(()=>{I(),B()})})}async function I(e,t){}function U(){const e=q(`
    <h3>👤 ${$((o==null?void 0:o.phone)??"")}</h3>
    <label>${r("name")}</label>
    <input class="auth-input" id="name" type="text" maxlength="24" value="${$((o==null?void 0:o.name)??"")}" placeholder="${r("name")}" />
    <button class="auth-primary" id="save">${r("save")}</button>
    <button class="auth-link danger" id="out">${r("signOut")}</button>`),t=e.querySelector("#name");t.focus(),e.querySelector("#save").addEventListener("click",async()=>{const n=t.value.trim();n&&(await K(n),o&&(o.name=n)),e.remove(),h()}),e.querySelector("#out").addEventListener("click",async()=>{await Q(),o=null,e.remove(),h()})}function V(){if(document.getElementById("auth-styles"))return;const e=document.createElement("style");e.id="auth-styles",e.textContent=`
    .auth-slot { display: inline-flex; }
    .auth-btn { border: 1px solid var(--accent); background: var(--accent); color: #fff;
      font: inherit; font-weight: 700; font-size: 0.9rem; padding: 0.4rem 1rem; border-radius: 999px; cursor: pointer; }
    .auth-btn:hover { filter: brightness(1.05); }
    .auth-modal { position: fixed; inset: 0; z-index: 9990; display: flex; flex-direction: column;
      align-items: center; justify-content: center; padding: 1.5rem;
      background: var(--grad-hero, linear-gradient(160deg, #1d2769 0%, #11163b 100%)); }
    .auth-brand { position: absolute; top: 1.25rem; left: 1.4rem; display: flex; align-items: center; gap: .5rem;
      color: #fff; font-weight: 800; font-size: 1.1rem; letter-spacing: -0.01em; }
    .auth-brand-icon { width: 1.95rem; height: 1.95rem; display: grid; place-items: center;
      background: var(--accent); border-radius: 9px; font-size: 1rem; }
    .auth-back { position: absolute; top: 1.1rem; right: 1.3rem; width: 2.3rem; height: 2.3rem; border-radius: 999px;
      border: 1px solid rgba(255,255,255,.3); background: rgba(255,255,255,.12); color: #fff; font-size: 1rem; cursor: pointer; }
    .auth-back:hover { background: rgba(255,255,255,.22); }
    .auth-stack { display: flex; flex-direction: column; gap: 14px; width: min(400px, 94vw); }
    .auth-promo { background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.32); color: #fff;
      border-radius: 14px; padding: .7rem 1rem; text-align: center; font-weight: 800; font-size: .95rem; }
    #timer { color: var(--muted); font-weight: 700; }
    .auth-card { position: relative; width: 100%; background: #fff; color: var(--text);
      border-radius: 18px; padding: 28px 26px; box-shadow: 0 24px 60px rgba(8,12,34,.45); display: flex; flex-direction: column; gap: 11px; }
    .auth-card h3 { font-size: 1.3rem; margin-bottom: 2px; }
    .auth-card label { font-size: 0.8rem; color: var(--muted); }
    .auth-input { width: 100%; padding: 0.7rem 0.8rem; border: 1px solid var(--line); border-radius: 10px; font: inherit; font-size: 1rem; }
    .auth-input:focus { outline: 2px solid var(--accent); border-color: var(--accent); }
    .auth-primary { margin-top: 4px; background: var(--accent); color: #fff; border: none; border-radius: 10px;
      padding: 0.7rem; font: inherit; font-weight: 700; cursor: pointer; }
    .auth-primary:disabled { opacity: .6; cursor: default; }
    .auth-link { background: none; border: none; color: var(--muted); font: inherit; cursor: pointer; padding: 4px; }
    .auth-link.danger { color: var(--accent-2); }
    .auth-hint { font-size: 0.82rem; color: var(--muted); }
    .auth-demo { font-size: 0.86rem; color: #1f6f43; background: #e9f8ef; border: 1px solid #bce8cf;
      border-radius: 8px; padding: 6px 10px; margin: 0; }
    .auth-demo strong { font-size: 1.05rem; letter-spacing: 2px; }
    .auth-err { font-size: 0.82rem; color: #d64545; min-height: 1em; margin: 0; }`,document.head.appendChild(e)}const L={coinPackages:[{id:"starter",coins:50,bonus:0,priceEtb:5},{id:"popular",coins:220,bonus:20,priceEtb:20,popular:!0},{id:"value",coins:600,bonus:120,priceEtb:50},{id:"pro",coins:1300,bonus:390,priceEtb:100}],paymentMethods:{telebirr:!0,topup:!0},maintenance:!1};function G(){return C()&&!Z()}async function ce(){if(!C())return L;const{data:e,error:t}=await T().from("app_config").select("value").eq("key","app").maybeSingle();if(t)return L;const n=(e==null?void 0:e.value)??{};return{...L,...n}}async function le(e,t){if(await x(),G())throw new R;const n=location.pathname.replace(/[^/]*$/,""),a=location.origin+n,i=location.origin+location.pathname,{data:l,error:c}=await T().functions.invoke("buy-coins",{body:{packageId:e.id,method:t,appBase:a,returnUrl:i}});if(c)throw c;return{order:l.order,sandbox:!!l.sandbox}}async function W(e){for(let t=0;t<30;t++){const{data:n,error:a}=await T().from("payment_orders").select("id, package_id, coins, amount_etb, method, status, created_at").eq("id",e).maybeSingle();if(a)throw a;if(n){const i=de(n);if(i.status!=="pending")return i}await new Promise(i=>setTimeout(i,1e3))}throw new Error("payment timed out")}function de(e){return{id:String(e.id),packageId:String(e.package_id),coins:Number(e.coins),amountEtb:Number(e.amount_etb),method:e.method,status:e.status,createdAt:new Date(e.created_at).getTime()}}const P={en:{buy:"Buy coins",store:"Coin store",coins:"coins",bonus:"bonus",popular:"Best value",payNow:"Pay",processing:"Processing…",success:"Coins added!",failed:"Payment failed",close:"Close",sandbox:"Demo — no real charge",signIn:"Sign in"},am:{buy:"ሳንቲም ይግዙ",store:"መደብር",coins:"ሳንቲሞች",bonus:"ጉርሻ",popular:"ምርጥ",payNow:"ይክፈሉ",processing:"በመከናወን…",success:"ተጨመረ!",failed:"አልተሳካም",close:"ዝጋ",sandbox:"ማሳያ",signIn:"ግባ"}},d=e=>(P[S()]??P.en)[e];let M={coinPackages:[],paymentMethods:{telebirr:!0,topup:!0},maintenance:!1};function ue(){if(G()){D();return}const e=me(`<h2>${d("store")}</h2><div class="pkg-grid" id="pkgGrid"></div>`),t=e.querySelector("#pkgGrid");for(const n of M.coinPackages){const a=document.createElement("button");a.className=`pkg-card${n.popular?" popular":""}`,a.innerHTML=`<strong>${n.coins+n.bonus}</strong> ${d("coins")}
      ${n.bonus?`<span class="bonus">+${n.bonus}</span>`:""}
      <span class="price">${n.priceEtb} ETB</span>`,a.addEventListener("click",()=>void pe(n,e)),t.appendChild(a)}}async function pe(e,t){const n=t.querySelector(".wallet-card");n.innerHTML=`<p>${d("processing")}</p>`;try{const a=M.paymentMethods.telebirr?"telebirr":"topup",{order:i,sandbox:l}=await le(e,a);if(i.redirectUrl){location.href=i.redirectUrl;return}const c=await W(i.id);c.status==="paid"?(n.innerHTML=`<p>✅ ${d("success")} +${c.coins} 🪙</p>
        <button class="btn primary">${d("close")}</button>`,n.querySelector("button").addEventListener("click",()=>t.remove()),await v()):(n.innerHTML=`<p>${d("failed")}</p><button class="btn">${d("close")}</button>`,n.querySelector("button").addEventListener("click",()=>t.remove())),l&&n.insertAdjacentHTML("afterbegin",`<p class="sandbox-note">${d("sandbox")}</p>`)}catch(a){if(a instanceof R){t.remove(),D();return}n.innerHTML=`<p>${d("failed")}</p><button class="btn">${d("close")}</button>`,n.querySelector("button").addEventListener("click",()=>t.remove())}}function me(e){var n;(n=document.querySelector(".wallet-modal"))==null||n.remove();const t=document.createElement("div");return t.className="wallet-modal",t.innerHTML=`<div class="wallet-scrim"></div><div class="wallet-card">${e}</div>`,document.body.appendChild(t),t.querySelector(".wallet-scrim").addEventListener("click",()=>t.remove()),t}async function fe(){E(()=>void v()),await x(),M=await ce();const e=new URLSearchParams(location.search),t=e.get("order");if(t){e.delete("order"),history.replaceState(null,"",location.pathname);try{await W(t),await v()}catch{}}}te();const u=e=>document.querySelector(e),g=e=>e.replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]);let y=[],p=null;async function X(){if(!C()){u("#featured").innerHTML=`<p class="muted">${s("play.offline")}</p>`,u("#tourneyList").innerHTML="";return}try{const[e,t,n]=await Promise.all([ne(),ae(),v()]);y=e,p=e[0]??null,be(t,n),ge(),ve(),he(t,n)}catch{u("#featured").innerHTML=`<p class="muted">${s("play.error")}</p>`}}function he(e,t){var n;u("#topBalances").innerHTML=`
    <span class="bal-chip">Lv <strong>${e.level}</strong></span>
    <span class="bal-chip">⭐ <strong>${e.xp.toLocaleString()}</strong></span>
    <span class="bal-chip">🪙 <strong id="coinBal">${t.toLocaleString()}</strong></span>
    <button id="buyBtn" class="btn sm primary">${s("hub.buyCoins")}</button>`,(n=u("#buyBtn"))==null||n.addEventListener("click",()=>ue())}function be(e,t){const n=u("#featured");if(!p){n.innerHTML=`<p class="muted">${s("play.noTourney")}</p>`;return}const a=S()==="am"?p.titleAm:p.titleEn;n.innerHTML=`
    <article class="featured-card">
      <div class="fc-info">
        <span class="fc-badge">🏆 ${g(a)}</span>
        <h2>EthioRunner</h2>
        <p class="fc-meta">${p.entryFeeCoins} 🪙 · ${p.attempts} ${s("hub.attempts")} · Lv ${p.minLevel}+</p>
        <p class="fc-bal">🪙 ${t.toLocaleString()} · Lv ${e.level}</p>
        <a class="btn primary" href="play/">▶ ${s("hub.play")}</a>
      </div>
      <div class="fc-board">
        <div class="fc-board-head">${s("hub.leaderboard")}</div>
        <ol class="leader-list" id="featBoard"><li class="muted-small">…</li></ol>
      </div>
    </article>`,j(p.id,5).then(i=>{const l=u("#featBoard");l&&(l.innerHTML=i.length?i.map(c=>J(c)).join(""):`<li class="muted-small">${s("play.noBoard")}</li>`)}).catch(()=>{})}function J(e){return`<li class="leader-row${e.isPlayer?" me":""}">
    <span class="lr-rank">${e.rank}</span>
    <span class="lr-name">${g(e.isPlayer?s("play.you"):e.name)}</span>
    <span class="lr-score">${e.score.toFixed(1)} RP</span>
  </li>`}function ge(){const e=u("#tourneyList");if(!y.length){e.innerHTML="";return}e.innerHTML=y.map(t=>{const n=S()==="am"?t.titleAm:t.titleEn,a=s(`hub.${t.period}`);return`<article class="tour-card" data-id="${t.id}">
      <div class="tc-top"><span class="tc-period">${g(a)}</span><span class="tc-fee">${t.entryFeeCoins} 🪙</span></div>
      <h3>${g(n)}</h3>
      <p class="tc-meta">${t.attempts} ${s("hub.attempts")} · Lv ${t.minLevel}+</p>
      <div class="tc-board" id="board-${t.id}">…</div>
      <a class="btn" href="play/">${s("hub.enter")}</a>
    </article>`}).join("");for(const t of y)j(t.id,3).then(n=>{const a=document.querySelector(`#board-${t.id}`);a&&(a.innerHTML=n.length?`<ol class="leader-list compact">${n.map(J).join("")}</ol>`:`<p class="muted-small">${s("play.noBoard")}</p>`)}).catch(()=>{}),re(t.id).then(n=>{if(n&&n.attemptsLeft>0){const a=document.querySelector(`.tour-card[data-id="${t.id}"] .tc-meta`);a&&(a.textContent+=` · 🎟️ ${n.attemptsLeft}`)}}).catch(()=>{})}function ye(e){return`<li class="leader-row${e.isPlayer?" me":""}">
    <span class="lr-rank">${e.rank}</span>
    <span class="lr-name">${g(e.isPlayer?s("play.you"):e.name)}</span>
    <span class="lr-score">${e.seasonScore.toFixed(1)} · ${e.tourneys}🏆</span>
  </li>`}function ve(){oe(10).then(e=>{u("#seasonBoard").innerHTML=e.length?`<ol class="leader-list">${e.map(ye).join("")}</ol>`:`<p class="muted-small">${s("play.noBoard")}</p>`}).catch(()=>{u("#seasonBoard").innerHTML=`<p class="muted-small">${s("play.error")}</p>`})}var z;(z=document.getElementById("langEn"))==null||z.addEventListener("click",()=>_("en"));var A;(A=document.getElementById("langAm"))==null||A.addEventListener("click",()=>_("am"));ee();w()&&ie();fe();E(()=>void X());x().then(()=>X());
