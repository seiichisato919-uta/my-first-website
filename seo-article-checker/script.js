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

// 特殊なパターン（「〜の時」→「〜のとき」）
const specialPatterns = [
    { pattern: /([ぁ-んァ-ヶー一-龠々]+)の時/g, replacement: '$1のとき' }
];

// DOM要素
const inputText = document.getElementById('input-text');
const outputText = document.getElementById('output-text');
const checkBtn = document.getElementById('check-btn');
const autoFixBtn = document.getElementById('auto-fix-btn');
const clearBtn = document.getElementById('clear-btn');
const copyBtn = document.getElementById('copy-btn');
const errorCount = document.getElementById('error-count');
const conversionCount = document.getElementById('conversion-count');
const errorList = document.getElementById('error-list');

// グローバル変数：検出された問題のリスト
let detectedIssues = [];

// 前後の文脈を取得
function getContext(text, startIndex, length, contextLength = 30) {
    const before = text.substring(Math.max(0, startIndex - contextLength), startIndex);
    const matched = text.substring(startIndex, startIndex + length);
    const after = text.substring(startIndex + length, Math.min(text.length, startIndex + length + contextLength));

    return { before, matched, after };
}

// 禁止表現を詳細にチェック
function checkForbiddenExpressionsDetailed(text) {
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
                replacement: '【削除推奨】',
                checked: true
            });
        }
    });

    return issues;
}

// 漢字変換が必要な箇所を詳細にチェック
function checkKanjiConversionsDetailed(text) {
    const issues = [];
    let issueId = detectedIssues.length;

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
                checked: true
            });
        }
    });

    // 特殊パターンのチェック
    specialPatterns.forEach(pattern => {
        let match;
        const regex = new RegExp(pattern.pattern);
        const text_copy = text;
        let offset = 0;

        while ((match = regex.exec(text_copy.substring(offset))) !== null) {
            const actualIndex = offset + match.index;
            const matchedText = match[0];
            const replacement = matchedText.replace(/の時/, 'のとき');
            const context = getContext(text, actualIndex, matchedText.length);

            issues.push({
                id: issueId++,
                type: 'conversion',
                expression: matchedText,
                startIndex: actualIndex,
                endIndex: actualIndex + matchedText.length,
                context: context,
                replacement: replacement,
                checked: true
            });

            offset = actualIndex + matchedText.length;
        }
    });

    return issues;
}

// 選択された修正を適用
function applySelectedFixes() {
    const text = inputText.value;
    const selectedIssues = detectedIssues.filter(issue => issue.checked);

    // 後ろから順に修正（インデックスがずれないように）
    selectedIssues.sort((a, b) => b.startIndex - a.startIndex);

    let fixedText = text;
    selectedIssues.forEach(issue => {
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

// 正規表現用のエスケープ
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// チェックボックスの状態変更ハンドラ
function handleCheckboxChange(issueId) {
    const issue = detectedIssues.find(i => i.id === issueId);
    if (issue) {
        issue.checked = !issue.checked;
    }
}

// 問題リストを表示（チェックボックス付き）
function displayIssuesWithCheckboxes() {
    errorList.innerHTML = '';

    if (detectedIssues.length === 0) {
        errorList.innerHTML = '<div class="no-errors">✓ 問題は見つかりませんでした</div>';
        return;
    }

    // 禁止表現セクション
    const forbiddenIssues = detectedIssues.filter(i => i.type === 'forbidden');
    if (forbiddenIssues.length > 0) {
        const forbiddenSection = document.createElement('div');
        forbiddenSection.className = 'error-section';
        forbiddenSection.innerHTML = '<h3>禁止表現が見つかりました：</h3>';

        const list = document.createElement('div');
        list.className = 'issue-list';

        forbiddenIssues.forEach(issue => {
            const item = document.createElement('div');
            item.className = 'issue-item forbidden';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `issue-${issue.id}`;
            checkbox.checked = issue.checked;
            checkbox.addEventListener('change', () => handleCheckboxChange(issue.id));

            const label = document.createElement('label');
            label.htmlFor = `issue-${issue.id}`;

            const expressionSpan = document.createElement('span');
            expressionSpan.className = 'expression';
            expressionSpan.textContent = `「${issue.expression}」→ ${issue.replacement}`;

            const contextSpan = document.createElement('div');
            contextSpan.className = 'context';
            contextSpan.innerHTML = `
                <span class="context-before">${escapeHtml(issue.context.before)}</span><span class="context-match">${escapeHtml(issue.context.matched)}</span><span class="context-after">${escapeHtml(issue.context.after)}</span>
            `;

            label.appendChild(expressionSpan);
            label.appendChild(contextSpan);

            item.appendChild(checkbox);
            item.appendChild(label);

            list.appendChild(item);
        });

        forbiddenSection.appendChild(list);
        errorList.appendChild(forbiddenSection);
    }

    // 漢字変換セクション
    const conversionIssues = detectedIssues.filter(i => i.type === 'conversion');
    if (conversionIssues.length > 0) {
        const conversionSection = document.createElement('div');
        conversionSection.className = 'error-section';
        conversionSection.innerHTML = '<h3>変換が必要な漢字：</h3>';

        const list = document.createElement('div');
        list.className = 'issue-list';

        conversionIssues.forEach(issue => {
            const item = document.createElement('div');
            item.className = 'issue-item conversion';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `issue-${issue.id}`;
            checkbox.checked = issue.checked;
            checkbox.addEventListener('change', () => handleCheckboxChange(issue.id));

            const label = document.createElement('label');
            label.htmlFor = `issue-${issue.id}`;

            const expressionSpan = document.createElement('span');
            expressionSpan.className = 'expression';
            expressionSpan.textContent = `「${issue.expression}」→「${issue.replacement}」`;

            const contextSpan = document.createElement('div');
            contextSpan.className = 'context';
            contextSpan.innerHTML = `
                <span class="context-before">${escapeHtml(issue.context.before)}</span><span class="context-match">${escapeHtml(issue.context.matched)}</span><span class="context-after">${escapeHtml(issue.context.after)}</span>
            `;

            label.appendChild(expressionSpan);
            label.appendChild(contextSpan);

            item.appendChild(checkbox);
            item.appendChild(label);

            list.appendChild(item);
        });

        conversionSection.appendChild(list);
        errorList.appendChild(conversionSection);
    }

    // 「すべて選択」「すべて解除」ボタンを追加
    const controlButtons = document.createElement('div');
    controlButtons.className = 'control-buttons';
    controlButtons.innerHTML = `
        <button id="select-all-btn" class="btn btn-small">すべて選択</button>
        <button id="deselect-all-btn" class="btn btn-small">すべて解除</button>
    `;
    errorList.insertBefore(controlButtons, errorList.firstChild);

    document.getElementById('select-all-btn').addEventListener('click', () => {
        detectedIssues.forEach(issue => issue.checked = true);
        displayIssuesWithCheckboxes();
    });

    document.getElementById('deselect-all-btn').addEventListener('click', () => {
        detectedIssues.forEach(issue => issue.checked = false);
        displayIssuesWithCheckboxes();
    });
}

// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// チェックボタン
checkBtn.addEventListener('click', () => {
    const text = inputText.value;

    if (!text.trim()) {
        alert('テキストを入力してください');
        return;
    }

    // 詳細な検出を実行
    detectedIssues = [];
    const forbiddenIssues = checkForbiddenExpressionsDetailed(text);
    const conversionIssues = checkKanjiConversionsDetailed(text);

    detectedIssues = [...forbiddenIssues, ...conversionIssues];

    // 統計を更新
    errorCount.textContent = forbiddenIssues.length;
    conversionCount.textContent = conversionIssues.length;

    // チェックボックス付きリストを表示
    displayIssuesWithCheckboxes();
    outputText.value = '';
});

// 自動修正ボタン
autoFixBtn.addEventListener('click', () => {
    const text = inputText.value;

    if (!text.trim()) {
        alert('テキストを入力してください');
        return;
    }

    if (detectedIssues.length === 0) {
        alert('先に「禁止表現をチェック」ボタンを押してください');
        return;
    }

    // 選択された修正を適用
    const fixedText = applySelectedFixes();
    outputText.value = fixedText;
});

// クリアボタン
clearBtn.addEventListener('click', () => {
    inputText.value = '';
    outputText.value = '';
    errorCount.textContent = '0';
    conversionCount.textContent = '0';
    errorList.innerHTML = '';
});

// コピーボタン
copyBtn.addEventListener('click', () => {
    if (!outputText.value) {
        alert('コピーするテキストがありません');
        return;
    }

    outputText.select();
    document.execCommand('copy');

    // フィードバック
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'コピーしました！';
    copyBtn.style.backgroundColor = '#28a745';

    setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.backgroundColor = '';
    }, 2000);
});
