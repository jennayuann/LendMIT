// src/utils/email.test.ts

import { assertEquals } from "jsr:@std/assert";
import {
  configureEmailTransport,
  sendEmail,
  type EmailTransport,
} from "./email.ts";

Deno.test("email: no-op when transport not configured", async () => {
  // Ensure no custom transport
  configureEmailTransport(null);
  const res = await sendEmail({ to: "nobody@example.com", subject: "Test" });
  assertEquals(typeof res, "object");
});

Deno.test("email: uses custom transport when configured", async () => {
  let called = 0;
  const ids: string[] = [];
  const mock: EmailTransport = {
    send({ to, subject, from: _from, text: _text, html: _html }) {
      called++;
      ids.push(`${to}:${subject}`);
      return Promise.resolve({ id: "mock-123" });
    },
  };
  configureEmailTransport(mock);
  const res = await sendEmail({
    to: "you@example.com",
    subject: "Hello",
    text: "Hi",
  });
  assertEquals(res.id, "mock-123");
  assertEquals(called, 1);

  // reset
  configureEmailTransport(null);
});
