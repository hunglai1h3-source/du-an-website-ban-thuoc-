/**
 * DrugNormalizer
 * Thuật toán chuẩn hóa chuỗi và so khớp khoảng cách chuỗi xác định (Deterministic String Similarity)
 * Tuyệt đối không gọi LLM để đoán thuốc.
 */

export class DrugNormalizer {
  /**
   * Chuẩn hóa văn bản cơ bản để tìm kiếm (không thay đổi ý nghĩa lâm sàng)
   */
  public static normalizeText(text: string): string {
    if (!text) return "";

    return text
      .normalize("NFKC") // Chuẩn hóa Unicode
      .toLowerCase()
      .replace(/[\.,\/\#!$%\^&\*;:{}=\-_`~()\[\]]/g, " ") // Bỏ ký tự đặc biệt
      .replace(/\s+/g, " ") // Gom nhiều khoảng trắng
      .trim();
  }

  /**
   * Chuẩn hóa các đơn vị hàm lượng y tế thông dụng
   * ví dụ: "500 mg" -> "500mg", "1 g" -> "1g", "250 ml" -> "250ml"
   */
  public static normalizeStrengthSpacing(text: string): string {
    if (!text) return "";

    return text.replace(
      /(\d+(?:[\.,]\d+)?)\s*(mg|g|ml|mcg|iu|ui|viên|vien|gói|goi|ống|ong)/gi,
      (_match, num, unit) => {
        return `${num.replace(",", ".")}${unit.toLowerCase()}`;
      }
    );
  }

  /**
   * Trích xuất hàm lượng từ chuỗi (ví dụ: "500mg", "625mg", "1g")
   */
  public static extractStrength(text: string): string | null {
    if (!text) return null;
    const match = text.match(/\b(\d+(?:[\.,]\d+)?\s*(?:mg|g|ml|mcg|iu|ui))\b/i);
    if (match && match[1]) {
      return this.normalizeStrengthSpacing(match[1]);
    }
    return null;
  }

  /**
   * Chuẩn hóa đặc thù cho OCR typos (ví dụ số 1 thay cho chữ l, số 0 thay cho chữ o)
   * Chỉ dùng để tạo search token phụ trợ, không làm biến đổi chuỗi gốc
   */
  public static getSearchKey(name: string): string {
    let normalized = this.normalizeText(name);
    normalized = this.normalizeStrengthSpacing(normalized);
    // Thay thế số 1 ở cuối từ thành chữ l (vd: paracetamo1 -> paracetamol)
    normalized = normalized.replace(/([a-z]+)1\b/g, "$1l");
    return normalized;
  }

  /**
   * Tính khoảng cách Levenshtein (Edit Distance)
   */
  public static levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Tính hệ số Sørensen–Dice (Bigram Similarity)
   * Rất nhạy với lỗi gõ đảo từ và lỗi OCR nhỏ
   */
  public static diceCoefficient(str1: string, str2: string): number {
    const s1 = str1.replace(/\s+/g, "");
    const s2 = str2.replace(/\s+/g, "");

    if (s1 === s2) return 1.0;
    if (s1.length < 2 || s2.length < 2) return 0.0;

    const bigrams1 = new Map<string, number>();
    for (let i = 0; i < s1.length - 1; i++) {
      const bigram = s1.substring(i, i + 2);
      bigrams1.set(bigram, (bigrams1.get(bigram) || 0) + 1);
    }

    let intersection = 0;
    for (let i = 0; i < s2.length - 1; i++) {
      const bigram = s2.substring(i, i + 2);
      const count = bigrams1.get(bigram) || 0;
      if (count > 0) {
        bigrams1.set(bigram, count - 1);
        intersection++;
      }
    }

    const totalBigrams = s1.length - 1 + (s2.length - 1);
    return parseFloat(((2.0 * intersection) / totalBigrams).toFixed(4));
  }

  /**
   * Tính điểm tương đồng tổng hợp xác định (Deterministic Score: 0.0 -> 1.0)
   */
  public static calculateSimilarity(source: string, target: string): number {
    const s1 = this.getSearchKey(source);
    const s2 = this.getSearchKey(target);

    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;

    // 1. Kiểm tra bao hàm (Substring match)
    if (s1.includes(s2) || s2.includes(s1)) {
      const minLen = Math.min(s1.length, s2.length);
      const maxLen = Math.max(s1.length, s2.length);
      const containmentScore = minLen / maxLen;
      if (containmentScore >= 0.75) {
        return parseFloat(Math.max(0.85, containmentScore).toFixed(4));
      }
    }

    // 2. Kết hợp Dice Coefficient và Levenshtein Ratio
    const dice = this.diceCoefficient(s1, s2);
    const maxLen = Math.max(s1.length, s2.length);
    const distance = this.levenshteinDistance(s1, s2);
    const levRatio = 1.0 - distance / maxLen;

    // Trọng số 60% Dice + 40% Levenshtein
    const combined = 0.6 * dice + 0.4 * Math.max(0, levRatio);
    return parseFloat(combined.toFixed(4));
  }
}
