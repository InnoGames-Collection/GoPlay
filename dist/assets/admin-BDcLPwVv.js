import"./modulepreload-polyfill-B5Qt9EMX.js";import{i,c as o,s as n}from"./auth-CAIh3L2-.js";const s=document.getElementById("app");async function d(){var e;if(!i()){s.innerHTML="<p>Set VITE_SUPABASE_* in .env</p>";return}await o();const a=(e=(await n().auth.getUser()).data.user)==null?void 0:e.id;if(!a){s.innerHTML='<p>Sign in required. <a href="../">Back to hub</a></p>';return}const{data:t}=await n().from("profiles").select("role").eq("id",a).maybeSingle();if((t==null?void 0:t.role)!=="admin"){s.innerHTML='<p>Admin access only. <a href="../">Back</a></p>';return}s.innerHTML=`
    <header class="admin-head"><h1>GoPlay Admin</h1><a href="../">← Hub</a></header>
    <section id="tourAdmin"><h2>Runner tournaments</h2><div id="tourRows">…</div></section>
    <section><h2>Actions</h2>
      <button id="ensureBtn" class="btn">Ensure windows</button>
      <button id="settleBtn" class="btn">Settle due</button>
    </section>`,await r(),document.getElementById("ensureBtn").addEventListener("click",async()=>{await n().rpc("ensure_runner_tournaments"),await r()}),document.getElementById("settleBtn").addEventListener("click",async()=>{await n().rpc("settle_due_runner_tournaments"),await r()})}async function r(){const{data:a}=await n().from("runner_tournaments").select("id, period, state, entry_fee_coins, attempts, prize_pool_coins, starts_at, ends_at").order("starts_at",{ascending:!1}).limit(20),t=document.getElementById("tourRows");t.innerHTML=(a??[]).map(e=>`
    <article class="admin-row">
      <strong>${e.id}</strong> · ${e.period} · ${e.state}<br/>
      Fee ${e.entry_fee_coins} · ${e.attempts} attempts · Pool ${e.prize_pool_coins} 🪙
      <br/><small>${e.starts_at} → ${e.ends_at}</small>
    </article>`).join("")||"<p>No tournaments</p>"}d();
