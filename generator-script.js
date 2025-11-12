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
