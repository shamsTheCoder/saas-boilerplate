// Onboarding will be fully built on Day 6.
// For now this page exists so loginAction can redirect here after a successful login.
export default function OnboardingPage() {
  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
        🎉 You&apos;re logged in!
      </h1>
      <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>
        Onboarding wizard coming on Day 6.
      </p>
    </div>
  );
}
