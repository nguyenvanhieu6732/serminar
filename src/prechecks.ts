import type { ReadyIssueContext } from "./github-context.js"
import type { PreflightReport } from "./report-schema.js"

export const MIN_USEFUL_BODY_LENGTH = 40

export type PrecheckReason = "empty_body" | "short_body"

export type PrecheckResult =
  | {
      readonly kind: "report"
      readonly reason: PrecheckReason
      readonly report: PreflightReport
    }
  | {
      readonly kind: "continue"
    }

export function runPrechecks(issue: ReadyIssueContext): PrecheckResult {
  const body = issue.issueBody.trim()

  if (body.length === 0) {
    return {
      kind: "report",
      reason: "empty_body",
      report: createInsufficientContextReport("empty_body")
    }
  }

  if (body.length < MIN_USEFUL_BODY_LENGTH) {
    return {
      kind: "report",
      reason: "short_body",
      report: createInsufficientContextReport("short_body")
    }
  }

  return { kind: "continue" }
}

function createInsufficientContextReport(
  reason: PrecheckReason
): PreflightReport {
  return {
    status: "high_risk",
    missing_context: [
      {
        category: "actor_or_role",
        detail: "Issue cần nêu rõ ai cần thay đổi này hoặc ai bị ảnh hưởng."
      },
      {
        category: "expected_behavior",
        detail: "Issue cần mô tả hành vi cần triển khai hoặc cần sửa."
      },
      {
        category: "acceptance_criteria",
        detail: "Issue cần có tiêu chí pass/fail có thể kiểm thử."
      },
      {
        category: "edge_and_failure_behavior",
        detail: "Issue cần mô tả các edge case quan trọng hoặc hành vi khi lỗi."
      }
    ],
    risk_explanation:
      reason === "empty_body"
        ? "Phần mô tả issue đang trống, nên chưa đủ chi tiết triển khai để phân tích an toàn."
        : "Phần mô tả issue chưa cung cấp đủ chi tiết triển khai để phân tích an toàn.",
    suggested_questions: [
      { text: "Người dùng hoặc actor nào bị ảnh hưởng bởi thay đổi này?" },
      { text: "Hành vi nào cần thay đổi, và hành vi nào cần giữ nguyên?" },
      {
        text: "Tiêu chí chấp nhận có thể kiểm thử để xác nhận hoàn thành là gì?"
      },
      {
        text: "Cần xử lý edge case, lỗi, hoặc vấn đề phân quyền nào?"
      }
    ],
    draft_acceptance_criteria: [],
    confidence: "high",
    evidence: [
      {
        source: "precheck",
        detail:
          reason === "empty_body"
            ? "Phần mô tả issue đang trống."
            : "Phần mô tả issue ngắn hơn ngưỡng tối thiểu để phân tích hữu ích."
      }
    ]
  }
}
