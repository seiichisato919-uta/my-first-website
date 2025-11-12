#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');

// 禁止表現リスト
const forbiddenExpressions = [
    'という',
    'することができます。',
    '大切です。',
    '重要です。',
    '鍵',
    'カギ',
    '少なくありません。',
    'しばしば見られます。',
    '一人ひとり',
    '一つひとつ',
    '1人1人',
    '1つひとつ',
    '第一歩',
    'なのです。',
    '秘訣',
    'なぜ',
    'どのように',
    'どうやって',
    'のです。',
    'ぜひ',
    '多様',
    '自身',
    '土台',
    'なのでしょうか。',
    'とても',
    '大幅な',
    '非常に'
];

// 漢字→ひらがな変換リスト
const kanjiToHiragana = {
    '持つ': 'もつ',
    '分かる': 'わかる',
    '分かり': 'わかり',
    '分かれば': 'わかれば',
    '出来る': 'できる',
    '言う': 'いう',
    '通り': 'とおり',
    '様々': 'さまざま',
};

// 色付きテキスト用のANSIコード
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    bgYellow: '\x1b[43m',
    bgRed: '\x1b[41m'
};

// 正規表現用のエスケープ
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 前後の文脈を取得
function getContext(text, startIndex, length, contextLength = 40) {
    const before = text.substring(Math.max(0, startIndex - contextLength), startIndex);
    const matched = text.substring(startIndex, startIndex + length);
    const after = text.substring(startIndex + length, Math.min(text.length, startIndex + length + contextLength));

    return { before, matched, after };
}

// 禁止表現を詳細にチェック
function checkForbiddenExpressions(text) {
    const issues = [];
    let issueId = 0;

    forbiddenExpressions.forEach(expression => {
        const regex = new RegExp(escapeRegExp(expression), 'g');
        let match;

        while ((match = regex.exec(text)) !== null) {
            const context = getContext(text, match.index, expression.length);
            issues.push({
                id: issueId++,
                type: 'forbidden',
                expression: expression,
                startIndex: match.index,
                endIndex: match.index + expression.length,
                context: context,
                replacement: '【要修正】',
            });
        }
    });

    return issues;
}

// 漢字変換が必要な箇所をチェック
function checkKanjiConversions(text) {
    const issues = [];
    let issueId = 0;

    Object.keys(kanjiToHiragana).forEach(kanji => {
        const regex = new RegExp(escapeRegExp(kanji), 'g');
        let match;

        while ((match = regex.exec(text)) !== null) {
            const context = getContext(text, match.index, kanji.length);
            issues.push({
                id: issueId++,
                type: 'conversion',
                expression: kanji,
                startIndex: match.index,
                endIndex: match.index + kanji.length,
                context: context,
                replacement: kanjiToHiragana[kanji],
            });
        }
    });

    // 特殊パターン（「〜の時」→「〜のとき」）
    const pattern = /([ぁ-んァ-ヶー一-龠々]+)の時/g;
    let match;

    while ((match = pattern.exec(text)) !== null) {
        const matchedText = match[0];
        const replacement = matchedText.replace(/の時/, 'のとき');
        const context = getContext(text, match.index, matchedText.length);

        issues.push({
            id: issueId++,
            type: 'conversion',
            expression: matchedText,
            startIndex: match.index,
            endIndex: match.index + matchedText.length,
            context: context,
            replacement: replacement,
        });
    }

    return issues;
}

// 問題を表示
function displayIssues(issues) {
    console.log('\n' + colors.cyan + '========================================' + colors.reset);
    console.log(colors.cyan + '  SEO記事 禁止表現チェック結果' + colors.reset);
    console.log(colors.cyan + '========================================' + colors.reset + '\n');

    const forbiddenIssues = issues.filter(i => i.type === 'forbidden');
    const conversionIssues = issues.filter(i => i.type === 'conversion');

    console.log(colors.yellow + `禁止表現数: ${forbiddenIssues.length}` + colors.reset);
    console.log(colors.yellow + `漢字変換数: ${conversionIssues.length}` + colors.reset);
    console.log('');

    if (forbiddenIssues.length > 0) {
        console.log(colors.red + '■ 禁止表現が見つかりました：' + colors.reset + '\n');
        forbiddenIssues.forEach((issue, index) => {
            console.log(colors.gray + `[${index + 1}]` + colors.reset + ` 「${colors.red}${issue.expression}${colors.reset}」→ ${issue.replacement}`);
            console.log(colors.gray + '   文脈: ' + colors.reset + issue.context.before + colors.bgRed + colors.reset + colors.red + issue.context.matched + colors.reset + issue.context.after);
            console.log('');
        });
    }

    if (conversionIssues.length > 0) {
        console.log(colors.yellow + '■ 変換が必要な漢字：' + colors.reset + '\n');
        conversionIssues.forEach((issue, index) => {
            console.log(colors.gray + `[${index + 1}]` + colors.reset + ` 「${colors.yellow}${issue.expression}${colors.reset}」→「${colors.green}${issue.replacement}${colors.reset}」`);
            console.log(colors.gray + '   文脈: ' + colors.reset + issue.context.before + colors.bgYellow + issue.context.matched + colors.reset + issue.context.after);
            console.log('');
        });
    }

    if (issues.length === 0) {
        console.log(colors.green + '✓ 問題は見つかりませんでした！' + colors.reset);
    }
}

// 修正を適用
function applyFixes(text, issues) {
    // 後ろから順に修正（インデックスがずれないように）
    issues.sort((a, b) => b.startIndex - a.startIndex);

    let fixedText = text;
    issues.forEach(issue => {
        const before = fixedText.substring(0, issue.startIndex);
        const after = fixedText.substring(issue.endIndex);

        if (issue.type === 'forbidden') {
            // 禁止表現は削除マーカーで置き換え
            fixedText = before + `【要修正: ${issue.expression}】` + after;
        } else {
            // 漢字は自動変換
            fixedText = before + issue.replacement + after;
        }
    });

    return fixedText;
}

// 差分を表示
function displayDiff(originalText, fixedText) {
    console.log('\n' + colors.cyan + '========================================' + colors.reset);
    console.log(colors.cyan + '  修正結果（差分表示）' + colors.reset);
    console.log(colors.cyan + '========================================' + colors.reset + '\n');

    const originalLines = originalText.split('\n');
    const fixedLines = fixedText.split('\n');

    const maxLines = Math.max(originalLines.length, fixedLines.length);

    for (let i = 0; i < maxLines; i++) {
        const originalLine = originalLines[i] || '';
        const fixedLine = fixedLines[i] || '';

        if (originalLine !== fixedLine) {
            console.log(colors.red + '- ' + originalLine + colors.reset);
            console.log(colors.green + '+ ' + fixedLine + colors.reset);
            console.log('');
        }
    }
}

// ユーザーに質問
function askUser(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.toLowerCase());
        });
    });
}

// メイン処理
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(colors.red + 'エラー: ファイルパスを指定してください' + colors.reset);
        console.log('使い方: node seo-check.js <ファイルパス>');
        console.log('例: node seo-check.js article.txt');
        process.exit(1);
    }

    const filePath = args[0];

    // ファイルの存在確認
    if (!fs.existsSync(filePath)) {
        console.log(colors.red + `エラー: ファイル「${filePath}」が見つかりません` + colors.reset);
        process.exit(1);
    }

    // ファイルを読み込み
    const text = fs.readFileSync(filePath, 'utf-8');

    // チェック実行
    const forbiddenIssues = checkForbiddenExpressions(text);
    const conversionIssues = checkKanjiConversions(text);
    const allIssues = [...forbiddenIssues, ...conversionIssues];

    // 結果を表示
    displayIssues(allIssues);

    if (allIssues.length === 0) {
        return;
    }

    // 修正するか確認
    const answer = await askUser('\n修正を適用しますか？ (y/n): ');

    if (answer === 'y' || answer === 'yes') {
        const fixedText = applyFixes(text, allIssues);

        // 差分を表示
        displayDiff(text, fixedText);

        // ファイルに保存するか確認
        const saveAnswer = await askUser('\n修正結果をファイルに保存しますか？ (y/n): ');

        if (saveAnswer === 'y' || saveAnswer === 'yes') {
            const outputPath = filePath.replace(/(\.[^.]+)$/, '_fixed$1');
            fs.writeFileSync(outputPath, fixedText, 'utf-8');
            console.log(colors.green + `\n✓ 修正結果を「${outputPath}」に保存しました！` + colors.reset);
        } else {
            console.log('\n修正結果（コピーして使用してください）：');
            console.log(colors.cyan + '========================================' + colors.reset);
            console.log(fixedText);
            console.log(colors.cyan + '========================================' + colors.reset);
        }
    } else {
        console.log('\n修正はキャンセルされました。');
    }
}

main();
