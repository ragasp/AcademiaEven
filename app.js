}const SUPABASE_URL = "https://hjswopqkifpvnukhxfiy.supabase.co";
const SUPABASE_KEY = "sb_publishable_ER_OIQ1S_uMMBTdt8neF5A_jBlqOLQd";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. تسجيل الدخول بحساب جوجل
async function loginWithGoogle() {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/index.html' }
  });
  if (error) alert("خطأ في تسجيل جوجل: " + error.message);
}

// 2. تسجيل الخروج
async function logoutUser() {
  await supabaseClient.auth.signOut();
  window.location.reload();
}

// 3. جلب بيانات المستخدم الحالي وتحديث الهيدر والتذكرة
async function loadCurrentUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  const authBtn = document.getElementById('headerAuthBtn');
  const userBadge = document.getElementById('userProfileBadge');

  if (!user) return null;

  let { data: profile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    const newProfile = {
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email.split('@')[0],
      email: user.email,
      role: 'student'
    };
    await supabaseClient.from('profiles').upsert(newProfile);
    profile = newProfile;
  }

  if (authBtn) authBtn.classList.add('hidden');
  if (userBadge) {
    userBadge.classList.remove('hidden');
    document.getElementById('navUserName').textContent = profile.full_name;
    document.getElementById('navUserRole').textContent = 
      profile.role === 'admin' ? '👑 مشرف عام' : (profile.role === 'doctor' ? '👨‍🏫 عضو لجنة علمية' : '🎓 باحث / طالب');
  }

  // تحديث اسم المستخدم على التذكرة الـ VIP
  const ticketName = document.getElementById('vipTicketName');
  if (ticketName) ticketName.textContent = profile.full_name;

  // جلب تذكرة المستخدم الحقيقية إن وجدت
  const { data: myTicket } = await supabaseClient
    .from('tickets')
    .select('*, events(title)')
    .eq('user_id', user.id)
    .order('booked_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (myTicket) {
    if (document.getElementById('vipTicketId')) {
      document.getElementById('vipTicketId').textContent = myTicket.ticket_code;
      document.getElementById('vipQrImg').src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(myTicket.ticket_code)}`;
      document.getElementById('vipStatusBadge').textContent = myTicket.attended ? "تم الحضور ✅" : "مؤكدة بالنظام";
    }
  }

  return profile;
}

// 4. فحص صلاحية الدخول لصفحة الأدمن والدكاترة
async function checkAdminAccess() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    if (confirm("يجب تسجيل الدخول أولاً للوصول لبوابة الإدارة. الانتقال لصفحة الدخول؟")) {
      window.location.href = "auth.html";
    }
    return;
  }
  window.location.href = "admin.html";
}

