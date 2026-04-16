import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const password = await hash(parsed.data.password, 12);

  const createdUser = await prisma.user.create({
    data: {
      email: parsed.data.email,
      password,
      plan: "free"
    },
    select: {
      id: true,
      email: true
    }
  });

  return NextResponse.json({ user: createdUser }, { status: 201 });
}
