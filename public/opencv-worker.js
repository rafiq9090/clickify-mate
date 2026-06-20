/**
 * PaperSnapPro Advanced OCR - Computer Vision Worker (V9 - Surgical Stroke Analyzer)
 */

self.Module = {
    onRuntimeInitialized: function() {
        self.cv = cv; // Explicitly bind for reliable access
        self.cvReady = true;
        self.postMessage({ action: 'ready' });
    }
};

self.importScripts('https://docs.opencv.org/4.10.0/opencv.js');

self.onmessage = async function(e) {
    const { action, imageData, ranges } = e.data;

    if (action === 'process') {
        try {
            if (!self.cvReady) throw new Error("Engines Warming Up...");
            const { isUnderlineMode, isMarkerMode } = e.data;
            const cv = self.cv;
            
            let img = new cv.Mat(imageData.height, imageData.width, cv.CV_8UC4);
            img.data.set(imageData.data);

            let gray = new cv.Mat();
            cv.cvtColor(img, gray, cv.COLOR_RGBA2GRAY);
            let rois = [];
            let cleanedImg = img.clone();

            // 1. HIGHLIGHTER DETECTION (Surgical Color Masking)
            if (isMarkerMode && ranges && ranges.length > 0) {
                let hsv = new cv.Mat();
                cv.cvtColor(img, hsv, cv.COLOR_RGBA2RGB); 
                cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
                
                let markerMask = new cv.Mat.zeros(img.rows, img.cols, cv.CV_8UC1);
                for (let range of ranges) {
                    if (!range || !range.lower || !range.upper) continue;
                    // Slicing to 3 channels to match HSV space
                    let low = cv.matFromArray(1, 3, cv.CV_8UC1, range.lower.slice(0, 3));
                    let high = cv.matFromArray(1, 3, cv.CV_8UC1, range.upper.slice(0, 3));
                    let mask = new cv.Mat();
                    cv.inRange(hsv, low, high, mask);
                    cv.bitwise_or(markerMask, mask, markerMask);
                    low.delete(); high.delete(); mask.delete();
                }

                let labels = new cv.Mat();
                let stats = new cv.Mat();
                let centroids = new cv.Mat();
                let count = cv.connectedComponentsWithStats(markerMask, labels, stats, centroids);

                for (let i = 1; i < count; i++) {
                    let left = stats.intAt(i, cv.CC_STAT_LEFT);
                    let top = stats.intAt(i, cv.CC_STAT_TOP);
                    let width = stats.intAt(i, cv.CC_STAT_WIDTH);
                    let height = stats.intAt(i, cv.CC_STAT_HEIGHT);
                    let area = stats.intAt(i, cv.CC_STAT_AREA);

                    if (area > 500 && area < 500000) {
                        cv.rectangle(cleanedImg, new cv.Point(left, top), new cv.Point(left + width, top + height), [255, 255, 255, 255], -1);
                        
                        let x = Math.max(0, left - 15), y = Math.max(0, top - 15);
                        let w = Math.min(img.cols - x, width + 30), h = Math.min(img.rows - y, height + 30);
                        let roiMat = gray.roi(new cv.Rect(x, y, w, h));
                        let upscale = new cv.Mat();
                        // LANCZOS4 for archival-grade upscaling
                        cv.resize(roiMat, upscale, new cv.Size(w * 3, h * 3), 0, 0, cv.INTER_LANCZOS4);
                        
                        // FORENSIC CLEANING PASS
                        let blurred = new cv.Mat();
                        cv.GaussianBlur(upscale, blurred, new cv.Size(3, 3), 0);
                        cv.adaptiveThreshold(blurred, upscale, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 25, 18);
                        
                        // INK RECOVERY (Dilation)
                        let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
                        cv.erode(upscale, upscale, kernel);
                        kernel.delete(); blurred.delete();

                        rois.push({ x, y, w, h, data: new Uint8ClampedArray(upscale.data), dw: w*3, dh: h*3 });
                        roiMat.delete(); upscale.delete();
                    }
                    if (rois.length > 50) break;
                }
                hsv.delete(); markerMask.delete(); labels.delete(); stats.delete(); centroids.delete();
            }

            // DEEP NEURAL-ANALYST UNDERLINE PIPELINE (Refined Forensic Mode)
            // DEEP NEURAL-ANALYST UNDERLINE PIPELINE (Refined Forensic Mode)
            if (isUnderlineMode) {
                // STAGE 1: Forensic Shadow-Kill & Background Normalization
                // This eliminates non-homogenous backgrounds and transparent paper bleed-through
                let kernelClose = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(35, 35));
                let background = new cv.Mat();
                cv.morphologyEx(gray, background, cv.MORPH_CLOSE, kernelClose);
                kernelClose.delete();

                let layer_1_flat = new cv.Mat();
                cv.divide(gray, background, layer_1_flat, 255, -1);
                background.delete();

                // STAGE 2: High-Fidelity Binarized Extraction
                let binary = new cv.Mat();
                cv.adaptiveThreshold(layer_1_flat, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 25, 4);
                layer_1_flat.delete();

                // STAGE 3: Connected Component Analysis (Isolated Signal)
                let horizontalKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(25, 1));
                let layer_3_mask = new cv.Mat();
                cv.morphologyEx(binary, layer_3_mask, cv.MORPH_OPEN, horizontalKernel);
                horizontalKernel.delete();
                binary.delete();

                // BRIDGE: Heal wavy/fragmented pen paths
                let layer_4_bridge = new cv.Mat();
                let bridgeKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(140, 1));
                cv.morphologyEx(layer_3_mask, layer_4_bridge, cv.MORPH_CLOSE, bridgeKernel);
                bridgeKernel.delete();
                layer_3_mask.delete();

                // STAGE 4: Spatial Alignment & Neural Merging
                let segments = [];
                let labels = new cv.Mat(), stats = new cv.Mat(), centroids = new cv.Mat();
                let count = cv.connectedComponentsWithStats(layer_4_bridge, labels, stats, centroids);

                for (let i = 1; i < count; i++) {
                    let w = stats.intAt(i, cv.CC_STAT_WIDTH);
                    let h = stats.intAt(i, cv.CC_STAT_HEIGHT);
                    
                    // Relaxed Geometry: Wavy handwriting can be tall (up to 95px)
                    if (w > 50 && h < 95) {
                        segments.push({
                            left: stats.intAt(i, cv.CC_STAT_LEFT),
                            top: stats.intAt(i, cv.CC_STAT_TOP),
                            width: w,
                            height: h
                        });
                    }
                }
                labels.delete(); stats.delete(); centroids.delete();

                // MERGE: Group segments on the same horizontal plane (Relaxed 65px Tolerance)
                segments.sort((a, b) => a.top - b.top);
                let merged_lines = [];
                for (let seg of segments) {
                    let matched = false;
                    for (let line of merged_lines) {
                        if (Math.abs(seg.top - line.top) < 65) {
                            let newLeft = Math.min(line.left, seg.left);
                            line.width = Math.max(line.left + line.width, seg.left + seg.width) - newLeft;
                            line.left = newLeft;
                            line.top = Math.min(line.top, seg.top);
                            line.height = Math.max(line.height, seg.height);
                            matched = true;
                            break;
                        }
                    }
                    if (!matched) merged_lines.push(seg);
                }

                for (let line of merged_lines) {
                    const { left, top, width, height } = line;
                    cv.rectangle(cleanedImg, new cv.Point(left, top + height + 2), new cv.Point(left + width, top + height + 8), [0, 255, 255, 120], -1);
                    cv.rectangle(cleanedImg, new cv.Point(left, top - 2), new cv.Point(left + width, top + height + 2), [255, 255, 255, 255], -1);
                    
                    // STAGE 5: Neural Row Isolation & Centering
                    let x = Math.max(0, left - 60), y = Math.max(0, top - 150); 
                    let w = Math.min(img.cols - x, width + 120), h = Math.min(img.rows - y, 200); 

                    if (w > 20 && h > 60) {
                        let preliminary = gray.roi(new cv.Rect(x, y, w, h));
                        let bin = new cv.Mat(), rowSum = new cv.Mat();
                        cv.threshold(preliminary, bin, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
                        cv.reduce(bin, rowSum, 1, cv.REDUCE_SUM, cv.CV_32F);
                        let maxVal = 0, peakY = h / 2;
                        for (let r = 0; r < h; r++) {
                            let v = rowSum.floatAt(r, 0); if (v > maxVal) { maxVal = v; peakY = r; }
                        }
                        bin.delete(); rowSum.delete();

                        let refinedY = Math.max(0, y + peakY - 45), refinedH = Math.min(img.rows - refinedY, 95);
                        let roiMat = gray.roi(new cv.Rect(x, refinedY, w, refinedH));
                        let upscale = new cv.Mat();
                        cv.resize(roiMat, upscale, new cv.Size(w * 3, refinedH * 3), 0, 0, cv.INTER_LANCZOS4);
                        
                        let blurred = new cv.Mat();
                        cv.GaussianBlur(upscale, blurred, new cv.Size(3, 3), 0);
                        cv.adaptiveThreshold(blurred, upscale, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 41, 15);
                        blurred.delete();

                        let roiRgba = new cv.Mat();
                        cv.cvtColor(upscale, roiRgba, cv.COLOR_GRAY2RGBA);
                        rois.push({ x, y: refinedY, w, h: refinedH, data: new Uint8ClampedArray(roiRgba.data), dw: roiRgba.cols, dh: roiRgba.rows });

                        roiRgba.delete(); roiMat.delete(); upscale.delete(); preliminary.delete();
                    }
                }
                layer_4_bridge.delete();
            }
                        
            let finalRgba = new cv.Mat();
            cv.cvtColor(cleanedImg, finalRgba, cv.COLOR_RGBA2RGB);
            cv.cvtColor(finalRgba, finalRgba, cv.COLOR_RGB2RGBA);
            let cleanedData = new Uint8ClampedArray(finalRgba.data);

            img.delete(); gray.delete(); cleanedImg.delete(); finalRgba.delete();

            self.postMessage({ 
                success: true, 
                rois: rois, 
                cleanedData: cleanedData, 
                width: imageData.width, 
                height: imageData.height 
            });

        } catch (err) {
            const errorMsg = typeof err === 'number' ? `CV Math Error (${err})` : String(err);
            self.postMessage({ success: false, error: errorMsg });
        }
    } else if (action === 'preprocess_full_page') {
        try {
            if (!self.cvReady) throw new Error("Engines Warming Up...");
            const cv = self.cv;
            
            let img = new cv.Mat(imageData.height, imageData.width, cv.CV_8UC4);
            img.data.set(imageData.data);

            let gray = new cv.Mat();
            cv.cvtColor(img, gray, cv.COLOR_RGBA2GRAY);

            // 1. LIGHTNING SHADOW NORMALIZATION (11x11 Kernel - High Speed)
            let blurred = new cv.Mat();
            cv.GaussianBlur(gray, blurred, new cv.Size(11, 11), 0);
            let normalized = new cv.Mat();
            cv.divide(gray, blurred, normalized, 255, -1);
            blurred.delete();

            // 2. RAPID ADAPTIVE BINARIZATION
            let binarized = new cv.Mat();
            cv.adaptiveThreshold(normalized, binarized, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 21, 15);
            normalized.delete();

            // 3. SURGICAL STROKE REPAIR
            let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
            cv.erode(binarized, binarized, kernel);
            kernel.delete();

            // 4. FAST RGBA EXPORT
            let finalRgba = new cv.Mat();
            cv.cvtColor(binarized, finalRgba, cv.COLOR_GRAY2RGBA);

            let resultData = new Uint8ClampedArray(finalRgba.data);
            self.postMessage({ 
                success: true, 
                processedData: resultData, 
                width: imageData.width, 
                height: imageData.height 
            }, [resultData.buffer]); 

            img.delete(); gray.delete(); binarized.delete(); finalRgba.delete();
        } catch (err) {
            self.postMessage({ success: false, error: String(err) });
        }
    }
};
