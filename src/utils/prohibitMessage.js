/**
* Kiểm tra xem chuỗi có chứa các mẫu phổ biến của URL, Path, hoặc Script không.
 * @param {string} inputString - Chuỗi cần kiểm tra.
 * @returns {boolean} - Trả về true nếu chuỗi chứa nội dung bị chặn, ngược lại là false.
 */

function normalize(str) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .toLowerCase();
}

// 🔧 Tạo regex chống bypass
function createFlexibleRegex(word) {
    const chars = word.split("");

    // cho phép ký tự chen vào giữa (., space, _, *)
    const pattern = chars
        .map((c) => `${c}+[^a-zA-Z0-9]*`)
        .join("");

    return new RegExp(`\\b${pattern}\\b`, "i");
}

const forbiddenWords_vi = ['đụ', 'lồn', 'cặc', 'địt', 'buồi', 'chửi thề', 'thằng chó', "giái", "nứng", "chó đẻ", "súc vật", "chóđẻ", "đỉ", "cộng sản", "sục", "ngu", "csvn" /* thêm các từ khác */];
const forbiddenWords_en = ['fuck', 'shit', 'asshole', 'bitch', 'damn', 'crap', "ass", "f.u.c.k" /* thêm các từ khác */];

export function containsForbiddenContent(inputString) {
    // Chuyển về chữ thường để kiểm tra không phân biệt chữ hoa/thường
    const lowerCaseInput = inputString.toLowerCase();

    // Biểu thức chính quy (RegEx) để phát hiện các mẫu sau:
    const regex = new RegExp([
        // 1. URLs và Đường dẫn: http(s)://, ftp://, www., domain.com, /path/to/file
        /(https?:\/\/\S+)/.source, // http://... hoặc https://...
        /(\b(www\.|ftp\.)\S+)/.source, // www.example.com
        /(\.\w{2,4}\b)/.source, // .com, .net, .org, v.v. (cần thận trọng với cái này)
        /(\/\w+\/\w+)/.source, // /path/to/file

        // 2. Scripting và HTML Tags nguy hiểm (Ngăn chặn XSS):
        /(<\s*script\b[^>]*>.*?<\s*\/\s*script\s*>)/.source, // <script>...</script>
        /(<\s*img\b[^>]*\s*onerror\s*=\s*['"][^'"]*['"][^>]*>)/.source, // <img onerror="...">
        /(<\s*a\b[^>]*\s*href\s*=\s*['"]javascript:[^'"]*['"][^>]*>)/.source, // <a href="javascript:...">
        /(<\s*\w+\b[^>]*>)/.source, // Bất kỳ thẻ HTML nào (nếu bạn muốn cấm TẤT CẢ HTML)
    ].join('|'), 'i'); // 'i' là case-insensitive

    return regex.test(lowerCaseInput);
}


// 🚀 MAIN FUNCTION
export function containsProfanity(input) {
    const normalizedInput = normalize(input);
    const allForbiddenWords = forbiddenWords_vi.concat(forbiddenWords_en);
    return allForbiddenWords.some((word) => {
        const normalizedWord = normalize(word);
        const regex = createFlexibleRegex(normalizedWord);

        return regex.test(normalizedInput);
    });
}