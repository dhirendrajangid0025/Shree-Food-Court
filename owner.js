const $ = id => document.getElementById(id);
const fmt = n => "₹" + Number(n).toLocaleString("en-IN");
function currentMonth() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
async function api(url, options={}) {
  const res = await fetch(url,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
async function checkSession() {
  const result = await api("/api/owner/me");
  $("loginPanel").hidden = result.loggedIn;
  $("dashboard").hidden = !result.loggedIn;
  $("logoutBtn").hidden = !result.loggedIn;
  if (result.loggedIn) loadOrders();
}
$("loginForm").addEventListener("submit",async e=>{
  e.preventDefault(); $("loginError").textContent="";
  try {
    await api("/api/owner/login",{method:"POST",body:JSON.stringify({username:$("username").value,password:$("password").value})});
    $("password").value=""; checkSession();
  } catch(err) { $("loginError").textContent=err.message; }
});
$("logoutBtn").addEventListener("click",async()=>{await api("/api/owner/logout",{method:"POST"});checkSession();});
$("monthPicker").value=currentMonth();
$("monthPicker").addEventListener("change",loadOrders);
async function loadOrders() {
  try {
    const data=await api(`/api/owner/orders?month=${encodeURIComponent($("monthPicker").value)}`);
    $("orderCount").textContent=data.summary.count;
    $("sales").textContent=fmt(data.summary.sales);
    $("paid").textContent=fmt(data.summary.paid);
    $("pending").textContent=data.summary.pending;
    $("ordersList").innerHTML=data.orders.length ? data.orders.map(order=>`
      <article class="order">
        <div class="order-head"><div><b>${esc(order.order_code)}</b> · ${esc(order.customer_name)}<br><small>${new Date(order.created_at).toLocaleString("en-IN")}</small></div><strong>${fmt(order.total)}</strong></div>
        <p>📞 ${esc(order.mobile)} · 📍 ${esc(order.address)}</p>
        <ul>${order.items.map(i=>`<li>${esc(i.name)} × ${i.quantity} — ${fmt(i.price*i.quantity)}</li>`).join("")}</ul>
        <p><b>Payment:</b> ${esc(order.payment_method)} / ${esc(order.payment_status)} &nbsp; <b>Order:</b> ${esc(order.order_status)}</p>
        <div class="controls">
          <select data-pay="${order.id}">
            <option value="pending" ${order.payment_status==="pending"?"selected":""}>Payment pending</option>
            <option value="paid" ${order.payment_status==="paid"?"selected":""}>Mark paid (verify in UPI app first)</option>
            <option value="refunded" ${order.payment_status==="refunded"?"selected":""}>Refunded</option>
          </select>
          <select data-status="${order.id}">
            ${["new","accepted","preparing","ready","completed","cancelled"].map(s=>`<option value="${s}" ${order.order_status===s?"selected":""}>${s}</option>`).join("")}
          </select>
          <button data-save="${order.id}">Save status</button>
        </div>
      </article>`).join("") : "<p class='muted'>No orders found for this month.</p>";
    $("ordersList").querySelectorAll("[data-save]").forEach(btn=>btn.addEventListener("click",async()=>{
      const id=btn.dataset.save;
      const paymentStatus=document.querySelector(`[data-pay="${id}"]`).value;
      const orderStatus=document.querySelector(`[data-status="${id}"]`).value;
      try { await api(`/api/owner/orders/${id}`,{method:"PATCH",body:JSON.stringify({paymentStatus,orderStatus})}); loadOrders(); }
      catch(err){alert(err.message);}
    }));
  } catch(err) { $("ordersList").textContent=err.message; }
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
checkSession();
