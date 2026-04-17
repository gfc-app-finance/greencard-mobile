import { Redirect } from 'expo-router';

export default function ProtectedIndexRoute() {
  return <Redirect href="/home" />;
}
