// === Camera Module ===
const Camera = {
  MAX_WIDTH: 1920,
  JPEG_QUALITY: 0.8,

  // Trigger photo capture and return a resized Blob
  capture() {
    return this._pickFile(true);
  },

  // Allow picking from gallery (no capture attribute)
  pick() {
    return this._pickFile(false);
  },

  _pickFile(useCamera) {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      if (useCamera) input.capture = 'environment';
      input.style.display = 'none';
      document.body.appendChild(input);

      let resolved = false;

      input.onchange = async () => {
        if (resolved) return;
        resolved = true;
        document.body.removeChild(input);

        if (!input.files || !input.files[0]) {
          reject(new Error('No file selected'));
          return;
        }
        try {
          const blob = await this.resizeImage(input.files[0]);
          resolve(blob);
        } catch (err) {
          reject(err);
        }
      };

      // Detect cancel: when window regains focus and no file was selected
      const onFocus = () => {
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            if (input.parentNode) document.body.removeChild(input);
            reject(new Error('Cancelled'));
          }
          window.removeEventListener('focus', onFocus);
        }, 500);
      };
      window.addEventListener('focus', onFocus);

      input.click();
    });
  },

  // Resize image to max width, return as JPEG Blob
  resizeImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        let { width, height } = img;
        if (width > this.MAX_WIDTH) {
          height = Math.round(height * (this.MAX_WIDTH / width));
          width = this.MAX_WIDTH;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create image blob'));
          },
          'image/jpeg',
          this.JPEG_QUALITY
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  },

  // Create an object URL for displaying a Blob
  createPreviewURL(blob) {
    return URL.createObjectURL(blob);
  },
};
