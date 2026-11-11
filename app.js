const SUPABASE_URL = "https://hjswopqkifpvnukhxfiy.supabase.co";
const SUPABASE_KEY = "sb_publishable_ER_OIQ1S_uMMBTdt8neF5A_jBlqOLQd";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// حماية النصوص من ثغرات XSS
function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// نظام إشعارات احترافي مدمج
function showToast(message, type = "success") {
  let toast = document.getElementById("globalToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "globalToast";
    toast.className = "fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 shadow-2xl border backdrop-blur-xl";
    document.body.appendChild(toast);
  }
  const styles = {
    success: "bg-emerald-950/90 border-emerald-400/50 text-emerald-200",
    error: "bg-red-950/90 border-red-400/50 text-red-200",
    info: "bg-amber-950/90 border-amber-400/50 text-amber-200"
  };
  toast.className = `fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl text-xs font-extrabold transition-all duration-300 shadow-2xl border backdrop-blur-xl ${styles[type] || styles.info}`;
  toast.textContent = message;
  toast.style.opacity = "1";
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.style.opacity = "0";
  }, 3500);
}

// فتح وإغلاق القائمة الجانبية
function toggleSidebar() {
  const drawer = document.getElementById("mainDrawer");
  if (drawer) drawer.classList.toggle("hidden");
}

// تسجيل الدخول بحساب Google
async function loginWithGoogle() {
  const redirectUrl = window.location.origin + "/index.html";
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectUrl }
  });
  if (error) showToast(error.message, "error");
}

// تسجيل الخروج
async function logoutUser() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

// مزامنة حساب المستخدم وتحديث الواجهة
async function loadCurrentUser() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  const user = session?.user;

  const guestActions = document.getElementById("headerGuestActions");
  const userActions = document.getElementById("headerUserActions");
  const drawerUserBox = document.getElementById("drawerUserBox");

  if (!user) {
    if (guestActions) guestActions.classList.remove("hidden");
    if (userActions) userActions.classList.add("hidden");
    return null;
  }

  let { data: profile } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const newProfile = {
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email.split("@")[0],
      email: user.email,
      role: "admin"
    };
    await supabaseClient.from("profiles").upsert(newProfile);
    profile = newProfile;
  }

  const roleLabels = {
    admin: "مشرف النظام",
    doctor: "عضو لجنة علمية",
    student: "باحث أكاديمي"
  };

  if (guestActions) guestActions.classList.add("hidden");
  if (userActions) {
    userActions.classList.remove("hidden");
    const nameEl = document.getElementById("headerUserName");
    const roleEl = document.getElementById("headerUserRole");
    if (nameEl) nameEl.textContent = profile.full_name;
    if (roleEl) roleEl.textContent = roleLabels[profile.role] || "باحث أكاديمي";
  }

  if (drawerUserBox) {
    drawerUserBox.innerHTML = `
      <div class="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
        <div>
          <p class="text-xs font-extrabold text-amber-300">${escapeHTML(profile.full_name)}</p>
          <p class="text-[10px] text-stone-400">${roleLabels[profile.role] || "باحث"}</p>
        </div>
        <button onclick="logoutUser()" class="px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-400/30 text-[10px] font-bold text-red-300">خروج</button>
      </div>
    `;
  }

  // تحديث التذكرة في الصفحة الرئيسية إن وجدت
  const ticketName = document.getElementById("vipTicketName");
  if (ticketName) ticketName.textContent = profile.full_name;

  const { data: myTicket } = await supabaseClient
    .from("tickets")
    .select("*")
    .eq("user_id", user.id)
    .order("booked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (myTicket && document.getElementById("vipTicketId")) {
    document.getElementById("vipTicketId").textContent = myTicket.ticket_code;
    document.getElementById("vipQrImg").src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(myTicket.ticket_code)}`;
    const statusEl = document.getElementById("vipStatusBadge");
    if (statusEl) {
      statusEl.textContent = myTicket.attended ? "تم إثبات الحضور" : "تذكرة نشطة";
    }
  }

  return profile;
}

// مراقبة تغير حالة الدخول تلقائياً (لدعم عودة Google OAuth)
supabaseClient.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_IN") {
    loadCurrentUser();
  }
});
