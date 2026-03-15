document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const resultsSection = document.getElementById('results-section');
    const previewImg = document.getElementById('preview-img');
    const metadataGrid = document.getElementById('metadata-grid');

    // Trigger file input when browse button or drop zone is clicked
    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // File input change event
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
        if (!file.type.startsWith('image/') && !isHeic) {
            alert('Please upload an image file (JPEG, PNG, WEBP, HEIC).');
            return;
        }

        resultsSection.classList.remove('hidden');
        metadataGrid.innerHTML = '<div class="loading-text">Extracting metadata...</div>';

        // Extract metadata independently of the preview rendering
        extractMetadata(file);

        // Show Image Preview
        if (isHeic) {
            previewImg.src = '';
            previewImg.alt = 'Converting HEIC for preview...';
            // Use heic2any to convert for web preview (returns a promise)
            if (typeof heic2any !== 'undefined') {
                heic2any({ blob: file, toType: "image/jpeg" })
                    .then((resultBlob) => {
                        const blobToUse = Array.isArray(resultBlob) ? resultBlob[0] : resultBlob;
                        previewImg.src = URL.createObjectURL(blobToUse);
                        previewImg.alt = 'Selected Photo';
                    })
                    .catch((e) => {
                        console.error('HEIC conversion error', e);
                        previewImg.alt = 'Preview not available for this HEIC file.';
                    });
            } else {
                previewImg.alt = 'Preview not available (heic2any not loaded).';
            }
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                previewImg.alt = 'Selected Photo';
            };
            reader.readAsDataURL(file);
        }
    }

    async function extractMetadata(file) {
        try {
            // Include basic file info
            const basicInfo = {
                'File Name': file.name,
                'File Size': formatBytes(file.size),
                'File Type': file.type || (file.name.toLowerCase().endsWith('.heic') ? 'image/heic' : 'Unknown')
            };

            // Parse EXIF and other metadata using exifr
            const meta = await exifr.parse(file, true);
            
            metadataGrid.innerHTML = '';
            
            // Render basic info
            Object.entries(basicInfo).forEach(([key, value]) => {
                renderMetadataItem(key, value, true);
            });

            if (meta) {
                const ignoredKeys = ['ImageWidth', 'ImageHeight']; 
                
                // Add Dimensions provided by Exif if present
                if (meta.ExifImageWidth && meta.ExifImageHeight) {
                    renderMetadataItem('Dimensions', `${meta.ExifImageWidth} x ${meta.ExifImageHeight} px`);
                }
                
                Object.entries(meta).forEach(([key, value]) => {
                    if (typeof value === 'object' && value !== null) {
                        if (value instanceof Date) {
                             renderMetadataItem(key, value.toLocaleString());
                        } else if (Array.isArray(value)) {
                            renderMetadataItem(key, value.join(', '));
                        }
                    } else if (!ignoredKeys.includes(key) && !key.startsWith('ExifImage')) { 
                        renderMetadataItem(formatKey(key), value);
                    }
                });
            } else {
                renderMetadataItem('Notice', 'No extended EXIF metadata found in this image.');
            }
            
        } catch (error) {
            console.error('Error extracting metadata:', error);
            metadataGrid.innerHTML = '';
            renderMetadataItem('File Name', file.name, true);
            renderMetadataItem('File Size', formatBytes(file.size), true);
            renderMetadataItem('Error', 'Failed to read extra metadata from image.');
        }
    }

    function renderMetadataItem(key, value, isBasic = false) {
        const item = document.createElement('div');
        item.className = 'metadata-item';
        if (isBasic) {
            item.style.borderLeftColor = 'var(--accent)';
        }
        
        item.innerHTML = `
            <span class="metadata-key">${key}</span>
            <span class="metadata-value">${value}</span>
        `;
        metadataGrid.appendChild(item);
    }

    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    function formatKey(key) {
        return key.replace(/([A-Z])/g, ' $1').trim();
    }
});
