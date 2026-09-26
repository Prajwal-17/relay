import { Redirect } from "expo-router";

import { authClient } from "@/lib/auth/auth-client";

export default function IndexScreen() {
  const session = authClient.useSession();

  return <Redirect href={session.data ? "/(tabs)/money" : "/sign-in"} />;
}
