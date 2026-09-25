import { APICallError } from "ai"

export type AIErrorInfo = {
  /** User-facing message, safe to render directly. */
  message: string
  /** HTTP status to respond with. */
  status: number
  /** Machine-readable category for client-side branching (e.g. showing a distinct alert style). */
  code: "billing_required" | "rate_limited" | "invalid_file" | "timeout" | "unknown"
}

/**
 * Classifies an error thrown by an AI SDK call (generateText/Output.object, etc.) into a
 * user-facing message, HTTP status, and category. AI Gateway returns 403s with a
 * `customer_verification_required` type when the account has no payment method on file,
 * which otherwise surfaces as an opaque 500 to the user.
 */
export function getAIErrorInfo(error: unknown): AIErrorInfo {
  if (APICallError.isInstance(error)) {
    const body = error.responseBody
    let parsedBody: unknown
    try {
      parsedBody = body ? JSON.parse(body) : undefined
    } catch {
      parsedBody = undefined
    }
    const errorType =
      typeof parsedBody === "object" && parsedBody !== null && "error" in parsedBody
        ? (parsedBody as { error?: { type?: string; code?: string } }).error
        : undefined

    if (
      error.statusCode === 403 &&
      (errorType?.type === "customer_verification_required" ||
        errorType?.code === "customer_verification_required" ||
        /credit card|customer_verification_required/i.test(body ?? ""))
    ) {
      return {
        message:
          "AI analysis is unavailable because this project's AI Gateway account has no valid payment method on file. Add a credit card in your Vercel account billing settings to enable AI-powered document analysis.",
        status: 403,
        code: "billing_required",
      }
    }

    if (error.statusCode === 429) {
      return {
        message: "The AI provider is rate-limiting requests right now. Please wait a moment and try again.",
        status: 429,
        code: "rate_limited",
      }
    }

    if (error.statusCode === 413 || /unsupported file|invalid.*file|too large/i.test(body ?? "")) {
      return {
        message: "This file could not be processed by the AI model. Try a smaller file or a different format (PDF, DOCX, or plain text).",
        status: 422,
        code: "invalid_file",
      }
    }

    return {
      message: `AI analysis failed (${error.statusCode ?? "unknown"}): ${error.message}`,
      status: error.statusCode ?? 500,
      code: "unknown",
    }
  }

  if (error instanceof Error && /timed? out|timeout/i.test(error.message)) {
    return {
      message: "The AI analysis took too long and timed out. Please try again with a shorter document.",
      status: 504,
      code: "timeout",
    }
  }

  return {
    message: "AI analysis failed. Please try again.",
    status: 500,
    code: "unknown",
  }
}
