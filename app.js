const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "novaBankDemo_v1";
let currentUser = null;
let toastTimer;

const money = n => "Q " + Number(n || 0).toLocaleString("es-GT",{minimumFractionDigits:2,maximumFractionDigits:2});
const dateTime = value => new Date(value).toLocaleString("es-GT",{dateStyle:"short",timeStyle:"short"});
const today = () => new Date().toLocaleDateString("es-GT",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
function loadDB(){
  try { const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)); if(saved && Array.isArray(saved.users)) return saved; } catch(e){}
  const admin={id:"admin",name:"Administrador NOVA",dpi:"0000000000000",email:"admin@novabank.demo",phone:"0000-0000",username:"admin",password:"2026",role:"admin",account:"1000000001",balance:12450,transactions:[
    {id:"NV-0001",date:new Date(Date.now()-86400000*2).toISOString(),description:"Depósito inicial",reference:"DEP-001",type:"in",amount:15000,balance:15000},
    {id:"NV-0002",date:new Date(Date.now()-86400000).toISOString(),description:"Compra en supermercado",reference:"POS-204",type:"out",amount:2550,balance:12450}
  ]};
  const db={users:[admin]}; saveDB(db); return db;
}
let db=loadDB();
function saveDB(data=db){localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}
function notify(message,error=false){const t=$("toast");t.textContent=message;t.className="toast show"+(error?" error":"");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.className="toast",3200);}
function showLanding(){ $("landing").classList.remove("hidden");$("auth").classList.add("hidden");$("bankApp").classList.add("hidden");}
function showAuth(mode="login"){
  $("landing").classList.add("hidden");$("auth").classList.remove("hidden");$("bankApp").classList.add("hidden");
  const isReg=mode==="register";$("loginForm").classList.toggle("hidden",isReg);$("registerForm").classList.toggle("hidden",!isReg);
  $("authTitle").textContent=isReg?"Abre tu cuenta NOVA":"Bienvenido de nuevo";$("authSubtitle").textContent=isReg?"Completa tus datos para crear tu perfil bancario.":"Ingresa tus datos para acceder a tu cuenta.";
  $("authNote").classList.toggle("hidden",isReg);$("authNote").innerHTML='¿Aún no tienes cuenta? <button id="switchRegister">Regístrate aquí</button>';
  $("switchRegister")?.addEventListener("click",()=>showAuth("register"));
}
function showApp(user){
  currentUser=user;$("landing").classList.add("hidden");$("auth").classList.add("hidden");$("bankApp").classList.remove("hidden");
  $("welcomeText").textContent=`Hola, ${user.name.split(" ")[0]}`;$("sideName").textContent=user.name;$("sideRole").textContent=user.role==="admin"?"Administrador · Demo":"Cliente NOVA";$("userAvatar").textContent=user.name.charAt(0).toUpperCase();$("todayDate").textContent=today();
  navigate("dashboard");renderAll();
}
function refreshUser(){const u=db.users.find(x=>x.id===currentUser.id);if(u){currentUser=u;}}
function navigate(view){
  document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));$("view-"+view).classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  const labels={dashboard:["Resumen de productos","RESUMEN","Consulta el estado general de tus productos."],accounts:["Consultar cuentas","CUENTAS","Información y saldo de tus cuentas."],transfer:["Transferencias","TRANSFERIR","Envía fondos de forma sencilla."],pay:["Pago de servicios","PAGOS","Paga tus servicios desde NOVA BANK."],statement:["Estado de cuenta","ESTADO DE CUENTA","Consulta el historial de tus operaciones."],profile:["Mis datos","PERFIL","Información de tu perfil de cliente."]};
  const l=labels[view];$("pageTitle").textContent=l[0];$("crumb").textContent=l[1];$("pageDesc").textContent=l[2];
  if(view==="statement")renderStatement();if(view==="profile")renderProfile();if(view==="transfer")$("transferAvailable").textContent=money(currentUser.balance);if(view==="pay")$("payAvailable").textContent=money(currentUser.balance);
}
function renderAll(){
  refreshUser();const u=currentUser,tx=[...u.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date));
  $("mainBalance").textContent=money(u.balance);$("availableBalance").textContent=money(u.balance);$("accountNumber").textContent="•••• "+u.account.slice(-4);$("transferCount").textContent=tx.filter(t=>t.description.toLowerCase().includes("transferencia")).length;$("movementCount").textContent=tx.length;
  $("accountNumber2").textContent=u.account;$("accountOwner").textContent=u.name;$("accountBalance").textContent=money(u.balance);
  $("recentMovements").innerHTML=tx.slice(0,5).map(movementHTML).join("")||'<div class="empty-state">No hay movimientos registrados.</div>';
  $("transferAvailable").textContent=money(u.balance);$("payAvailable").textContent=money(u.balance);
}
function movementHTML(t){return `<div class="movement"><div class="movement-icon">${t.type==="in"?"↓":t.description.toLowerCase().includes("pago")?"⌁":"↑"}</div><div class="movement-info"><b>${escapeHTML(t.description)}</b><small>${dateTime(t.date)} · ${escapeHTML(t.reference)}</small></div><div class="movement-amount ${t.type}">${t.type==="in"?"+":"−"} ${money(t.amount)}</div></div>`;}
function escapeHTML(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function addTransaction(description,reference,type,amount){
  const balance=type==="in"?currentUser.balance+amount:currentUser.balance-amount;
  currentUser.balance=Number(balance.toFixed(2));
  currentUser.transactions.push({id:"NV-"+String(Date.now()).slice(-8),date:new Date().toISOString(),description,reference,type,amount:Number(amount.toFixed(2)),balance:currentUser.balance});
  const index=db.users.findIndex(u=>u.id===currentUser.id);db.users[index]=currentUser;saveDB();renderAll();
}
function validAmount(raw){const n=Number(raw);if(!Number.isFinite(n)||n<=0){notify("Ingresa un monto válido mayor que cero.",true);return null;}if(n>currentUser.balance){notify("No tienes saldo suficiente para realizar esta operación.",true);return null;}return Number(n.toFixed(2));}
function renderStatement(){
  refreshUser();$("statementOwner").textContent=currentUser.name;$("statementAccount").textContent=currentUser.account;$("statementBalance").textContent=money(currentUser.balance);
  const rows=[...currentUser.transactions].sort((a,b)=>new Date(a.date)-new Date(b.date));
  $("statementRows").innerHTML=rows.map(t=>`<tr><td>${dateTime(t.date)}</td><td>${escapeHTML(t.description)}</td><td>${escapeHTML(t.reference)}</td><td class="${t.type==="in"?"type-in":"type-out"}">${t.type==="in"?"Crédito":"Débito"}</td><td class="right">${t.type==="in"?"+":"−"} ${money(t.amount)}</td><td class="right">${money(t.balance)}</td></tr>`).join("");
  $("emptyStatement").classList.toggle("hidden",rows.length>0);
}
function renderProfile(){
  const fields=[["Nombre completo",currentUser.name],["DPI / Identificación",currentUser.dpi],["Correo electrónico",currentUser.email],["Teléfono",currentUser.phone],["Usuario",currentUser.username],["Número de cuenta",currentUser.account],["Tipo de cliente",currentUser.role==="admin"?"Administrador de demostración":"Cliente"]];
  $("profileDetails").innerHTML=fields.map(([a,b])=>`<div class="profile-field"><small>${a}</small><b>${escapeHTML(b)}</b></div>`).join("");
}
$("goLogin").onclick=$("heroLogin").onclick=()=>showAuth("login");
$("goRegister").onclick=$("heroRegister").onclick=()=>showAuth("register");
$("backHome").onclick=$("authBack").onclick=(e)=>{e.preventDefault();showLanding();};
$("loginForm").addEventListener("submit",e=>{
  e.preventDefault();const username=$("loginUser").value.trim().toLowerCase(),password=$("loginPass").value;
  const user=db.users.find(u=>(u.username.toLowerCase()===username||u.email.toLowerCase()===username)&&u.password===password);
  if(!user){notify("Usuario o contraseña incorrectos.",true);return;}showApp(user);
});
$("registerForm").addEventListener("submit",e=>{
  e.preventDefault();const username=$("regUser").value.trim(),email=$("regEmail").value.trim().toLowerCase();
  if(db.users.some(u=>u.username.toLowerCase()===username.toLowerCase()||u.email===email)){notify("Ese usuario o correo ya está registrado.",true);return;}
  const user={id:"u"+Date.now(),name:$("regName").value.trim(),dpi:$("regDpi").value.trim(),email,phone:$("regPhone").value.trim(),username,password:$("regPass").value,role:"client",account:String(Math.floor(1000000000+Math.random()*8999999999)),balance:2500,transactions:[{id:"NV-"+Date.now(),date:new Date().toISOString(),description:"Depósito de bienvenida (demo)",reference:"APERTURA",type:"in",amount:2500,balance:2500}]};
  db.users.push(user);saveDB();notify("Registro completado. Tu cuenta ha sido creada.");showApp(user);
});
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.goto)));
$("transferForm").addEventListener("submit",e=>{
  e.preventDefault();const amount=validAmount($("transferAmount").value);if(amount===null)return;
  const dest=$("destAccount").value.trim();if(dest===currentUser.account){notify("No puedes transferir a tu propia cuenta.",true);return;}
  addTransaction("Transferencia a "+$("beneficiary").value.trim(),"DEST. "+dest,"out",amount);
  $("transferForm").reset();notify("Transferencia registrada correctamente (simulación).");
});
$("payForm").addEventListener("submit",e=>{
  e.preventDefault();const amount=validAmount($("payAmount").value);if(amount===null)return;
  addTransaction("Pago de "+$("serviceType").value+" · "+$("provider").value.trim(),"REF. "+$("serviceRef").value.trim(),"out",amount);
  $("payForm").reset();notify("Pago registrado correctamente (simulación).");
});
$("printStatement").onclick=()=>window.print();
$("logoutBtn").onclick=()=>{currentUser=null;showLanding();notify("Has cerrado tu sesión.");};
showLanding();
