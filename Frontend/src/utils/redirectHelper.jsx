export const getRedirectRoute = (user, isForgotPassword = false) => {
  if (isForgotPassword) return "/forgot-reset-password";

  const { onboarding_status, login_status, role } = user;

  if (!onboarding_status && !login_status) {
    // First-time login → show change password
    return "/change-onboarding-password";
  }

  if (!onboarding_status && login_status) {
    // Onboarding not completed → show onboarding form
    return "/new-user-form";
  }

  if (onboarding_status && !login_status) {
    // Onboarding done but login inactive → show change password again
    return "/change-password";
  }

  if (onboarding_status && login_status) {
    // Normal active employee → dashboard based on role
    if (role === "HR") return "/hr-dashboard";
    if (role === "Manager") return "/manager-dashboard";
    if(role=="Account Manager") return "/account-dashboard/profile";
    return "/employee-dashboard";
  }

  // Default fallback
  return "/";
};
