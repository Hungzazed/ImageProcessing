public/
├── index.html
├── styles.css
├── app.js
└── assets/

# Yêu cầu frontend UI

Tạo giao diện đẹp, hiện đại, responsive.

## Giao diện phải có:

### 1. Upload Area

- Drag and drop upload
- Button chọn ảnh
- Preview ảnh gốc

### 2. Processing Options

Cho phép chọn:

- Width
- Height
- Filter:
  - grayscale
  - sepia
  - blur
  - brightness
- Compression quality
- Watermark text

### 3. Process Button

Nút:
"Process Image"

### 4. Processing Status

Hiển thị realtime:

- Uploading...
- Resizing...
- Applying filter...
- Adding watermark...
- Compressing...
- Saving output...
- Completed

Hiển thị progress bar animation.

### 5. Output Preview

Sau khi xử lý:

- Hiển thị ảnh đã xử lý
- Hiển thị metadata
- Hiển thị dung lượng file
- Hiển thị thời gian xử lý

### 6. Download Button

Sau khi xử lý xong:

- Hiện nút:
  "Download Processed Image"

Cho phép tải ảnh về.
