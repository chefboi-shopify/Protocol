import { cookies } from "next/headers";

const MOCK_USER_ID_KEY = "protocol-user-id";

export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(MOCK_USER_ID_KEY)?.value ?? null;
}
