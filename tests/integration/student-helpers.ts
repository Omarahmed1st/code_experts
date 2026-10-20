// Student accounts for the tests: a registered student and the Cookie header
// their browser would send (local development uses the plain cookie name).
import { registerStudent } from "@/server/students/accounts";

export const STUDENT_PASSWORD = "green tea and long walks";

let counter = 0;

export async function makeStudent(name = "Sara"): Promise<{ id: string; email: string; token: string; cookie: string; recoveryCode: string }> {
  counter += 1;
  const email = `student${counter}-${crypto.randomUUID().slice(0, 8)}@example.com`;
  const made = await registerStudent({ email, name, password: STUDENT_PASSWORD, turnstileToken: null, ip: null, userAgent: "test" });
  if (!made.ok) throw new Error(made.error);
  return { id: made.value.userId, email, token: made.value.token, cookie: `ce_session=${made.value.token}`, recoveryCode: made.value.recoveryCode };
}
