import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("SHIPPO WEBHOOK EVENT:", body)

    return new NextResponse("OK", { status: 200 })
  } catch (error) {
    console.error("Webhook error:", error)
    return new NextResponse("Error", { status: 500 })
  }
}
