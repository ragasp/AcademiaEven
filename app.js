// استدعاء مكتبة Supabase الرسمية وربطها بمشروعك مباشرة
const SUPABASE_URL = "https://hjswopqkifpvnukhxfiy.supabase.co";
const SUPABASE_KEY = "sb_publishable_ER_OIQ1S_uMMBTdt8neF5A_jBlqOLQd";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// دالة تسجيل الدخول بحساب جوجل
async function loginWithGoogle() {
  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/index.html'
    }
  });
  if (error) alert("خطأ في تسجيل جوجل: " + error.message);
}

// دالة فحص الحساب الحالي ومنع غير المشرفين من دخول لوحة الأدمن
async function verifyRoleAndRedirect(requiredRole) {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    window.location.href = "auth.html";
    return null;
  }

  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (requiredRole && profile.role !== requiredRole && profile.role !== 'admin') {
    alert("🔒 غير مصرح لك بالدخول لهذه البوابة! صلاحيتك الحالية: " + profile.role);
    window.location.href = "index.html";
    return null;
  }
  return profile;
}
