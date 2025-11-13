// グローバル変数
let canvas, ctx;
let uploadedImage = null;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let currentTextX = 50;
let currentTextY = 50;

// DOM要素の取得
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    initializeEventListeners();
});

// イベントリスナーの初期化
function initializeEventListeners() {
    // 画像アップロード
    const imageUpload = document.getElementById('imageUpload');
    const uploadLabel = document.querySelector('.upload-label');

    imageUpload.addEventListener('change', handleImageUpload);

    // ドラッグ&ドロップ
    uploadLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadLabel.classList.add('dragover');
    });

    uploadLabel.addEventListener('dragleave', () => {
        uploadLabel.classList.remove('dragover');
    });

    uploadLabel.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadLabel.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            imageUpload.files = files;
            handleImageUpload({ target: imageUpload });
        }
    });

    // テキスト入力
    document.getElementById('postText').addEventListener('input', updateCanvas);

    // スタイル設定
    document.getElementById('fontSize').addEventListener('input', (e) => {
        document.getElementById('fontSizeValue').textContent = e.target.value + 'px';
        updateCanvas();
    });

    document.getElementById('fontWeight').addEventListener('change', updateCanvas);

    document.getElementById('textColor').addEventListener('input', (e) => {
        document.getElementById('textColorHex').value = e.target.value;
        updateCanvas();
    });

    document.getElementById('textColorHex').addEventListener('input', (e) => {
        const value = e.target.value;
        if (/^#[0-9A-F]{6}$/i.test(value)) {
            document.getElementById('textColor').value = value;
            updateCanvas();
        }
    });

    document.getElementById('strokeColor').addEventListener('input', (e) => {
        document.getElementById('strokeColorHex').value = e.target.value;
        updateCanvas();
    });

    document.getElementById('strokeColorHex').addEventListener('input', (e) => {
        const value = e.target.value;
        if (/^#[0-9A-F]{6}$/i.test(value)) {
            document.getElementById('strokeColor').value = value;
            updateCanvas();
        }
    });

    document.getElementById('strokeWidth').addEventListener('input', (e) => {
        document.getElementById('strokeWidthValue').textContent = e.target.value + 'px';
        updateCanvas();
    });

    document.getElementById('lineHeight').addEventListener('input', (e) => {
        document.getElementById('lineHeightValue').textContent = e.target.value;
        updateCanvas();
    });

    document.getElementById('textAlign').addEventListener('change', updateCanvas);

    // 位置調整
    document.getElementById('textX').addEventListener('input', (e) => {
        currentTextX = parseInt(e.target.value);
        document.getElementById('textXValue').textContent = e.target.value + '%';
        updateCanvas();
    });

    document.getElementById('textY').addEventListener('input', (e) => {
        currentTextY = parseInt(e.target.value);
        document.getElementById('textYValue').textContent = e.target.value + '%';
        updateCanvas();
    });

    // キャンバス上でのドラッグ
    canvas.addEventListener('mousedown', startDrag);
    canvas.addEventListener('mousemove', drag);
    canvas.addEventListener('mouseup', endDrag);
    canvas.addEventListener('mouseleave', endDrag);

    // タッチイベント（スマホ対応）
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        canvas.dispatchEvent(mouseEvent);
    });

    // ダウンロードボタン
    document.getElementById('downloadBtn').addEventListener('click', downloadImage);

    // リセットボタン
    document.getElementById('resetBtn').addEventListener('click', resetAll);
}

// 画像アップロード処理
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            uploadedImage = img;
            setupCanvas();
            updateCanvas();
            document.getElementById('placeholder').style.display = 'none';
            document.getElementById('downloadBtn').disabled = false;
            canvas.style.cursor = 'move';
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// キャンバスのセットアップ
function setupCanvas() {
    if (!uploadedImage) return;

    // キャンバスサイズを画像に合わせる
    const maxWidth = 800;
    const maxHeight = 800;

    let width = uploadedImage.width;
    let height = uploadedImage.height;

    // 最大サイズに収まるようにリサイズ
    if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
    }

    canvas.width = uploadedImage.width;
    canvas.height = uploadedImage.height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
}

// キャンバスの更新
function updateCanvas() {
    if (!uploadedImage) return;

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景画像を描画
    ctx.drawImage(uploadedImage, 0, 0, canvas.width, canvas.height);

    // テキストを描画
    const text = document.getElementById('postText').value;
    if (text) {
        drawText(text);
    }
}

// テキスト描画
function drawText(text) {
    const fontSize = parseInt(document.getElementById('fontSize').value);
    const fontWeight = document.getElementById('fontWeight').value;
    const textColor = document.getElementById('textColor').value;
    const strokeColor = document.getElementById('strokeColor').value;
    const strokeWidth = parseInt(document.getElementById('strokeWidth').value);
    const lineHeight = parseFloat(document.getElementById('lineHeight').value);
    const textAlign = document.getElementById('textAlign').value;

    // フォント設定
    ctx.font = `${fontWeight} ${fontSize}px 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif`;
    ctx.textAlign = textAlign;
    ctx.textBaseline = 'middle';

    // テキストを行ごとに分割
    const lines = text.split('\n');
    const lineHeightPx = fontSize * lineHeight;

    // テキストの開始位置を計算
    const x = (currentTextX / 100) * canvas.width;
    const totalHeight = lineHeightPx * (lines.length - 1);
    const startY = (currentTextY / 100) * canvas.height - totalHeight / 2;

    // 各行を描画
    lines.forEach((line, index) => {
        const y = startY + index * lineHeightPx;

        // 縁取り
        if (strokeWidth > 0) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.strokeText(line, x, y);
        }

        // テキスト本体
        ctx.fillStyle = textColor;
        ctx.fillText(line, x, y);
    });
}

// ドラッグ開始
function startDrag(e) {
    if (!uploadedImage) return;

    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    dragStartX = e.clientX - rect.left;
    dragStartY = e.clientY - rect.top;
    canvas.style.cursor = 'grabbing';
}

// ドラッグ中
function drag(e) {
    if (!isDragging || !uploadedImage) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // 実際のキャンバスサイズに対する割合を計算
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = currentX * scaleX;
    const canvasY = currentY * scaleY;

    // パーセンテージに変換
    currentTextX = Math.max(0, Math.min(100, (canvasX / canvas.width) * 100));
    currentTextY = Math.max(0, Math.min(100, (canvasY / canvas.height) * 100));

    // スライダーを更新
    document.getElementById('textX').value = currentTextX;
    document.getElementById('textXValue').textContent = Math.round(currentTextX) + '%';
    document.getElementById('textY').value = currentTextY;
    document.getElementById('textYValue').textContent = Math.round(currentTextY) + '%';

    updateCanvas();
}

// ドラッグ終了
function endDrag() {
    if (isDragging) {
        isDragging = false;
        canvas.style.cursor = 'move';
    }
}

// 画像ダウンロード
function downloadImage() {
    if (!uploadedImage) return;

    const link = document.createElement('a');
    const timestamp = new Date().getTime();
    link.download = `x-post-image-${timestamp}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// リセット
function resetAll() {
    // 入力をクリア
    document.getElementById('postText').value = '';
    document.getElementById('imageUpload').value = '';

    // デフォルト値に戻す
    document.getElementById('fontSize').value = 48;
    document.getElementById('fontSizeValue').textContent = '48px';
    document.getElementById('fontWeight').value = 'bold';
    document.getElementById('textColor').value = '#000000';
    document.getElementById('textColorHex').value = '#000000';
    document.getElementById('strokeColor').value = '#ffffff';
    document.getElementById('strokeColorHex').value = '#ffffff';
    document.getElementById('strokeWidth').value = 0;
    document.getElementById('strokeWidthValue').textContent = '0px';
    document.getElementById('lineHeight').value = 1.4;
    document.getElementById('lineHeightValue').textContent = '1.4';
    document.getElementById('textAlign').value = 'center';
    document.getElementById('textX').value = 50;
    document.getElementById('textXValue').textContent = '50%';
    document.getElementById('textY').value = 50;
    document.getElementById('textYValue').textContent = '50%';

    currentTextX = 50;
    currentTextY = 50;

    // キャンバスをクリア
    uploadedImage = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('placeholder').style.display = 'flex';
    document.getElementById('downloadBtn').disabled = true;
    canvas.style.cursor = 'default';
}

// ============================================
// AI文章生成機能
// ============================================

// ナレッジベース（サンプルデータ - 後でユーザーのデータに置き換え可能）
const KNOWLEDGE_BASE = {
    style: {
        tone: "親しみやすく前向き",
        structure: "【】や①②③を使った構造化",
        closing: "リプ・リポスト促進",
        emphasis: "【】での強調"
    },
    examples: [
        // 文体のサンプル（ユーザーのスプレッドシートデータに置き換え）
        "【情報】フリーランスの節税テクニック\n\n①青色申告を活用\n②経費の適切な計上\n③小規模企業共済の活用\n\n効果には個人差があります。\n参考になりましたら、リポストをお願いします。"
    ]
};

// APIキー管理
class APIKeyManager {
    constructor() {
        this.storageKey = 'claude_api_key';
    }

    save(apiKey) {
        try {
            localStorage.setItem(this.storageKey, apiKey);
            return true;
        } catch (error) {
            console.error('APIキーの保存に失敗しました:', error);
            return false;
        }
    }

    load() {
        try {
            return localStorage.getItem(this.storageKey);
        } catch (error) {
            console.error('APIキーの読み込みに失敗しました:', error);
            return null;
        }
    }

    delete() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('APIキーの削除に失敗しました:', error);
            return false;
        }
    }

    exists() {
        return this.load() !== null;
    }
}

const apiKeyManager = new APIKeyManager();

// プロンプト生成
function generatePrompt(topic) {
    const systemPrompt = `あなたはフリーランス向けコミュニティのX投稿自動生成AIです。

# 重要なルール
1. 文体・構成はナレッジベースのスタイルを参考にする
2. 内容は必ずインターネット検索結果に基づく最新情報を使用
3. ナレッジベースの具体的な内容はコピーしない
4. 絵文字・ハッシュタグは使用しない
5. 法人アカウントとしてコンプライアンスを遵守
6. 280文字以内に収める

# 文体スタイル（ナレッジベースより）
- トーン: ${KNOWLEDGE_BASE.style.tone}
- 構成: ${KNOWLEDGE_BASE.style.structure}
- クロージング: ${KNOWLEDGE_BASE.style.closing}
- 強調方法: ${KNOWLEDGE_BASE.style.emphasis}

# 例（文体のみ参考、内容は使用しない）
${KNOWLEDGE_BASE.examples[0]}

上記の文体スタイルで、以下のトピックについて5つの異なる投稿を生成してください。
内容は最新のトレンドや実用的な情報に基づいてください。`;

    const userPrompt = `トピック: ${topic}

上記トピックについて、ナレッジベースの文体を使って5つの投稿案を生成してください。
各投稿は以下の形式で出力してください：

---投稿1---
[投稿内容]
---投稿2---
[投稿内容]
---投稿3---
[投稿内容]
---投稿4---
[投稿内容]
---投稿5---
[投稿内容]`;

    return { systemPrompt, userPrompt };
}

// Claude API呼び出し
async function generateAIContent(topic, apiKey) {
    const { systemPrompt, userPrompt } = generatePrompt(topic);

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',  // 最新のClaude 3.5 Sonnet
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API呼び出しに失敗しました');
        }

        const data = await response.json();
        const content = data.content[0].text;

        // 投稿を分割
        const posts = parseGeneratedContent(content);
        return posts;

    } catch (error) {
        console.error('AI生成エラー:', error);
        throw error;
    }
}

// 生成されたコンテンツをパース
function parseGeneratedContent(content) {
    // ---投稿N--- の形式で分割
    const posts = [];
    const sections = content.split(/---投稿\d+---/);

    sections.forEach(section => {
        const trimmed = section.trim();
        if (trimmed && trimmed.length > 10) {
            posts.push(trimmed);
        }
    });

    // 5つに満たない場合は、改行で分割を試みる
    if (posts.length < 5) {
        const alternativeSplit = content.split(/\n\n\n+/);
        return alternativeSplit.filter(p => p.trim().length > 10).slice(0, 5);
    }

    return posts.slice(0, 5);
}

// AI機能の初期化
function initAIFeatures() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const deleteApiKeyBtn = document.getElementById('deleteApiKeyBtn');
    const apiKeyStatus = document.getElementById('apiKeyStatus');
    const generateAiBtn = document.getElementById('generateAiBtn');
    const topicInput = document.getElementById('topicInput');
    const aiHelpBtn = document.getElementById('aiHelpBtn');
    const aiHelpGuide = document.getElementById('aiHelpGuide');
    const aiResults = document.getElementById('aiResults');
    const aiResultsList = document.getElementById('aiResultsList');

    // ページ読み込み時にAPIキーをチェック
    if (apiKeyManager.exists()) {
        const savedKey = apiKeyManager.load();
        apiKeyInput.value = savedKey;
        showApiKeyStatus('APIキーが保存されています', 'success');
        deleteApiKeyBtn.style.display = 'inline-block';
        generateAiBtn.disabled = false;
    }

    // 使い方ボタン
    aiHelpBtn.addEventListener('click', () => {
        if (aiHelpGuide.style.display === 'none') {
            aiHelpGuide.style.display = 'block';
            aiHelpBtn.textContent = '❌ 閉じる';
        } else {
            aiHelpGuide.style.display = 'none';
            aiHelpBtn.textContent = '❓ 使い方';
        }
    });

    // APIキー保存
    saveApiKeyBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();

        if (!apiKey) {
            showApiKeyStatus('APIキーを入力してください', 'error');
            return;
        }

        if (!apiKey.startsWith('sk-ant-')) {
            showApiKeyStatus('有効なAPIキーを入力してください（sk-ant-で始まる）', 'error');
            return;
        }

        if (apiKeyManager.save(apiKey)) {
            showApiKeyStatus('APIキーを保存しました', 'success');
            deleteApiKeyBtn.style.display = 'inline-block';
            generateAiBtn.disabled = false;
        } else {
            showApiKeyStatus('APIキーの保存に失敗しました', 'error');
        }
    });

    // APIキー削除
    deleteApiKeyBtn.addEventListener('click', () => {
        if (confirm('保存されたAPIキーを削除しますか？')) {
            if (apiKeyManager.delete()) {
                apiKeyInput.value = '';
                showApiKeyStatus('APIキーを削除しました', 'info');
                deleteApiKeyBtn.style.display = 'none';
                generateAiBtn.disabled = true;
            }
        }
    });

    // トピック入力監視
    topicInput.addEventListener('input', () => {
        const hasApiKey = apiKeyManager.exists() || apiKeyInput.value.trim().length > 0;
        const hasTopic = topicInput.value.trim().length > 0;
        generateAiBtn.disabled = !(hasApiKey && hasTopic);
    });

    // AI生成ボタン
    generateAiBtn.addEventListener('click', async () => {
        const topic = topicInput.value.trim();
        const apiKey = apiKeyManager.load() || apiKeyInput.value.trim();

        if (!topic) {
            alert('トピックを入力してください');
            return;
        }

        if (!apiKey) {
            alert('APIキーを保存してください');
            return;
        }

        // ローディング状態
        generateAiBtn.classList.add('loading');
        generateAiBtn.disabled = true;
        generateAiBtn.textContent = '生成中...';
        aiResults.style.display = 'none';

        try {
            const posts = await generateAIContent(topic, apiKey);

            // 結果を表示
            displayAIResults(posts);

            // 成功メッセージ
            showApiKeyStatus('5つの投稿案を生成しました！', 'success');

        } catch (error) {
            console.error('生成エラー:', error);
            let errorMessage = 'AI生成に失敗しました: ' + error.message;

            if (error.message.includes('API key')) {
                errorMessage = 'APIキーが無効です。正しいAPIキーを設定してください。';
            } else if (error.message.includes('quota')) {
                errorMessage = 'APIの利用枠を超えています。OpenAIのアカウントを確認してください。';
            }

            showApiKeyStatus(errorMessage, 'error');
            alert(errorMessage);

        } finally {
            // ローディング解除
            generateAiBtn.classList.remove('loading');
            generateAiBtn.disabled = false;
            generateAiBtn.innerHTML = '<span>✨</span> AI文章を生成する（5案）';
        }
    });

    function showApiKeyStatus(message, type) {
        apiKeyStatus.textContent = message;
        apiKeyStatus.className = `api-status ${type}`;
        apiKeyStatus.style.display = 'block';
    }

    function displayAIResults(posts) {
        aiResultsList.innerHTML = '';

        posts.forEach((post, index) => {
            const item = document.createElement('div');
            item.className = 'ai-result-item';
            item.innerHTML = `
                <div class="ai-result-number">投稿案 ${index + 1}</div>
                <div class="ai-result-text">${post}</div>
            `;

            // クリックで投稿テキストに反映
            item.addEventListener('click', () => {
                document.getElementById('postText').value = post;
                updateCanvas();

                // 選択状態を表示
                document.querySelectorAll('.ai-result-item').forEach(el => {
                    el.classList.remove('selected');
                });
                item.classList.add('selected');

                // スクロールして投稿テキストエリアを表示
                document.getElementById('postText').scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            });

            aiResultsList.appendChild(item);
        });

        aiResults.style.display = 'block';
    }
}

// AI機能を初期化（既存のDOMContentLoadedに追加）
document.addEventListener('DOMContentLoaded', () => {
    initAIFeatures();
});
