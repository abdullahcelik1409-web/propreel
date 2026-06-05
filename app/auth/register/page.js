import AuthForm from "@/components/AuthForm";

export default function RegisterPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return <AuthForm mode="register" googleEnabled={googleEnabled} />;
}
