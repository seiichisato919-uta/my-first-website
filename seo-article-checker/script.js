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
    // パターンマッチング用（文脈を考慮）
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

// 禁止表現をチェック
function checkForbiddenExpressions(text) {
    const errors = [];

    forbiddenExpressions.forEach(expression => {
        const regex = new RegExp(escapeRegExp(expression), 'g');
        const matches = text.match(regex);

        if (matches) {
            errors.push({
                expression: expression,
                count: matches.length,
                type: 'forbidden'
            });
        }
    });

    return errors;
}

// 漢字変換が必要な箇所をチェック
function checkKanjiConversions(text) {
    const conversions = [];

    Object.keys(kanjiToHiragana).forEach(kanji => {
        const regex = new RegExp(escapeRegExp(kanji), 'g');
        const matches = text.match(regex);

        if (matches) {
            conversions.push({
                expression: kanji,
                count: matches.length,
                type: 'conversion',
                replacement: kanjiToHiragana[kanji]
            });
        }
    });

    // 特殊パターンのチェック
    specialPatterns.forEach(pattern => {
        const matches = [...text.matchAll(pattern.pattern)];
        if (matches.length > 0) {
            conversions.push({
                expression: '〜の時',
                count: matches.length,
                type: 'conversion',
                replacement: '〜のとき'
            });
        }
    });

    return conversions;
}

// 自動修正
function autoFix(text) {
    let fixedText = text;

    // 漢字→ひらがな変換
    Object.keys(kanjiToHiragana).forEach(kanji => {
        const regex = new RegExp(escapeRegExp(kanji), 'g');
        fixedText = fixedText.replace(regex, kanjiToHiragana[kanji]);
    });

    // 特殊パターンの変換
    specialPatterns.forEach(pattern => {
        fixedText = fixedText.replace(pattern.pattern, pattern.replacement);
    });

    // 禁止表現を削除または警告（ここでは強調表示）
    forbiddenExpressions.forEach(expression => {
        const regex = new RegExp(escapeRegExp(expression), 'g');
        fixedText = fixedText.replace(regex, `【要修正: ${expression}】`);
    });

    return fixedText;
}

// 正規表現用のエスケープ
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// エラーリストを表示
function displayErrors(errors, conversions) {
    errorList.innerHTML = '';

    if (errors.length === 0 && conversions.length === 0) {
        errorList.innerHTML = '<div class="no-errors">✓ 問題は見つかりませんでした</div>';
        return;
    }

    if (errors.length > 0) {
        const forbiddenSection = document.createElement('div');
        forbiddenSection.className = 'error-section';
        forbiddenSection.innerHTML = '<h3>禁止表現が見つかりました：</h3>';

        const list = document.createElement('ul');
        errors.forEach(error => {
            const li = document.createElement('li');
            li.className = 'error-item forbidden';
            li.textContent = `「${error.expression}」 - ${error.count}箇所`;
            list.appendChild(li);
        });

        forbiddenSection.appendChild(list);
        errorList.appendChild(forbiddenSection);
    }

    if (conversions.length > 0) {
        const conversionSection = document.createElement('div');
        conversionSection.className = 'error-section';
        conversionSection.innerHTML = '<h3>変換が必要な漢字：</h3>';

        const list = document.createElement('ul');
        conversions.forEach(conv => {
            const li = document.createElement('li');
            li.className = 'error-item conversion';
            li.textContent = `「${conv.expression}」→「${conv.replacement}」 - ${conv.count}箇所`;
            list.appendChild(li);
        });

        conversionSection.appendChild(list);
        errorList.appendChild(conversionSection);
    }
}

// チェックボタン
checkBtn.addEventListener('click', () => {
    const text = inputText.value;

    if (!text.trim()) {
        alert('テキストを入力してください');
        return;
    }

    const errors = checkForbiddenExpressions(text);
    const conversions = checkKanjiConversions(text);

    errorCount.textContent = errors.reduce((sum, err) => sum + err.count, 0);
    conversionCount.textContent = conversions.reduce((sum, conv) => sum + conv.count, 0);

    displayErrors(errors, conversions);
    outputText.value = '';
});

// 自動修正ボタン
autoFixBtn.addEventListener('click', () => {
    const text = inputText.value;

    if (!text.trim()) {
        alert('テキストを入力してください');
        return;
    }

    const fixedText = autoFix(text);
    outputText.value = fixedText;

    // 修正後の再チェック
    const errors = checkForbiddenExpressions(fixedText);
    const conversions = checkKanjiConversions(fixedText);

    errorCount.textContent = errors.reduce((sum, err) => sum + err.count, 0);
    conversionCount.textContent = conversions.reduce((sum, conv) => sum + conv.count, 0);

    displayErrors(errors, conversions);
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
