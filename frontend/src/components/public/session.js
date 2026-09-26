// Where a signed-in visitor's own pages start, mirroring the redirect in Login.jsx.
// Returns null for guests so the public pages show "Log in / Sign up" instead.
const HOME_BY_ROLE = {
  ADMIN: '/admin/dashboard',
  STAFF: '/expert/dashboard',
  LECTURER: '/expert/dashboard',
  STUDENT: '/participant/events',
};

export function sessionHomePath() {
  try {
    if (!localStorage.getItem('token')) return null;
    return HOME_BY_ROLE[localStorage.getItem('userRole')] || null;
  } catch {
    return null;
  }
}
