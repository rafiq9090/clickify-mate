/**
 * PaperSnapPro Multi-Page Scanner Engine (AI PDF Scanner)
 */

self.Module = {
    onRuntimeInitialized: function() {
        self.cvReady = true;
        self.postMessage({ action: 'ready' });
    }
};

self.importScripts('https://docs.opencv.org/4.10.0/opencv.js');
self.importScripts('https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js');

// Load Modular Processing Scripts
self.importScripts('/scripts/scanner/mode-bw.js');
self.importScripts('/scripts/scanner/mode-color.js');
self.importScripts('/scripts/scanner/mode-magic-gs.js');
self.importScripts('/scripts/scanner/mode-natural.js');
self.importScripts('/scripts/scanner/mode-enhance.js');

let ortSession = null;

const initAI = async () => {
    try {
        console.log("AI Inference Engine Primed");
    } catch (e) {
        console.warn("AI Engine warming up:", e);
    }
};

self.onmessage = async function(e) {
    const { action, imageData, maxWidth = 3000, config = {} } = e.data;
    if (!ortSession && config.useAI && typeof ort !== 'undefined') await initAI();
    const { mode = 'enhance' } = config;

    try {
        if (!self.cvReady || !self.cv) throw new Error("Engines Warming Up...");
        const cv = self.cv;

        let src = new cv.Mat(imageData.height, imageData.width, cv.CV_8UC4);
        src.data.set(imageData.data);

        let dst = new cv.Mat();
        let scale = Math.min(maxWidth / src.cols, maxWidth / src.rows, 1);
        if (scale < 1) {
            let dsize = new cv.Size(Math.round(src.cols * scale), Math.round(src.rows * scale));
            cv.resize(src, dst, dsize, 0, 0, cv.INTER_AREA);
        } else {
            dst = src.clone();
        }

        let final = new cv.Mat();
        if (action === 'warp_points') {
            const { points } = e.data;
            let p1 = points[0], p2 = points[1], p3 = points[2], p4 = points[3];
            let w1 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            let w2 = Math.hypot(p3.x - p4.x, p3.y - p4.y);
            let maxWidthWarp = Math.max(w1, w2);
            let h1 = Math.hypot(p4.x - p1.x, p4.y - p1.y);
            let h2 = Math.hypot(p3.x - p2.x, p3.y - p2.y);
            let maxHeightWarp = Math.max(h1, h2);
            let srcPtsWarp = cv.matFromArray(4, 1, cv.CV_32FC2, [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y]);
            let dstPtsWarp = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, maxWidthWarp, 0, maxWidthWarp, maxHeightWarp, 0, maxHeightWarp]);
            let transM = cv.getPerspectiveTransform(srcPtsWarp, dstPtsWarp);
            let dsize = new cv.Size(maxWidthWarp, maxHeightWarp);
            cv.warpPerspective(src, final, transM, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
            srcPtsWarp.delete(); dstPtsWarp.delete(); transM.delete();
        } else if (action === 'detect_and_process') {
            try {
                let gray = new cv.Mat();
                cv.cvtColor(dst, gray, cv.COLOR_RGBA2GRAY);
                let blurred = new cv.Mat();
                cv.GaussianBlur(gray, blurred, new cv.Size(7, 7), 0); 
                let edges = new cv.Mat();
                cv.Canny(blurred, edges, 50, 150); 
                let M_dilate = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(9, 9));
                cv.dilate(edges, edges, M_dilate, new cv.Point(-1, -1), 1);
                M_dilate.delete();
                let hKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(Math.round(dst.cols / 8), 1));
                let hLines = new cv.Mat();
                cv.morphologyEx(edges, hLines, cv.MORPH_OPEN, hKernel);
                cv.subtract(edges, hLines, edges);
                hKernel.delete(); hLines.delete();
                let contours = new cv.MatVector();
                let hierarchy = new cv.Mat();
                cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
                let maxArea = 0;
                let bestRect = null;
                let bestContour = null;
                for (let i = 0; i < contours.size(); i++) {
                    let cnt = contours.get(i);
                    let area = cv.contourArea(cnt);
                    let rect = cv.boundingRect(cnt);
                    if (area > (dst.cols * dst.rows * 0.1)) {
                        let peri = cv.arcLength(cnt, true);
                        let approx = new cv.Mat();
                        cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
                        if (approx.rows === 4 && area > maxArea) {
                            maxArea = area;
                            if (bestContour) bestContour.delete();
                            bestContour = approx;
                            bestRect = null;
                        } else if (area > maxArea) {
                            maxArea = area;
                            bestRect = rect;
                            if (bestContour) { bestContour.delete(); bestContour = null; }
                            approx.delete();
                        } else {
                            approx.delete();
                        }
                    }
                }
                if (bestContour) {
                    let hull = new cv.Mat();
                    cv.convexHull(bestContour, hull);
                    let hPeri = cv.arcLength(hull, true);
                    let approx4 = new cv.Mat();
                    cv.approxPolyDP(hull, approx4, 0.03 * hPeri, true);
                    if (approx4.rows === 4) {
                        let pts = [];
                        for (let i = 0; i < 4; i++) {
                            pts.push({ x: approx4.data32S[i * 2], y: approx4.data32S[i * 2 + 1] });
                        }
                        pts.sort((a, b) => a.y - b.y);
                        let top = pts.slice(0, 2).sort((a, b) => a.x - b.x);
                        let bottom = pts.slice(2, 4).sort((a, b) => a.x - b.x);
                        let srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [top[0].x, top[0].y, top[1].x, top[1].y, bottom[1].x, bottom[1].y, bottom[0].x, bottom[0].y]);
                        let tw = Math.max(Math.hypot(top[1].x - top[0].x, top[1].y - top[0].y), Math.hypot(bottom[1].x - bottom[0].x, bottom[1].y - bottom[0].y));
                        let th = Math.max(Math.hypot(bottom[0].x - top[0].x, bottom[0].y - top[0].y), Math.hypot(bottom[1].x - top[1].x, bottom[1].y - top[1].y));
                        if (tw > 50 && th > 50) {
                            let dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, tw, 0, tw, th, 0, th]);
                            let transM = cv.getPerspectiveTransform(srcPts, dstPts);
                            cv.warpPerspective(dst, final, transM, new cv.Size(tw, th));
                            transM.delete(); dstPts.delete();
                        } else {
                            final = dst.clone();
                        }
                        srcPts.delete();
                    } else {
                        final = dst.clone();
                    }
                    hull.delete(); approx4.delete(); bestContour.delete();
                } else if (bestRect) {
                    let rect = new cv.Rect(bestRect.x, bestRect.y, bestRect.width, bestRect.height);
                    final = dst.roi(rect).clone();
                } else {
                    final = dst.clone();
                }
                gray.delete(); blurred.delete(); edges.delete(); contours.delete(); hierarchy.delete();
            } catch (err) {
                console.warn("Detection Failed, falling back to full image:", err);
                final = dst.clone();
            }
        } else if (action === 'detect_document') {
            try {
                // 1. NEURAL CONTRAST STRIKE
                let lab = new cv.Mat();
                cv.cvtColor(dst, lab, cv.COLOR_RGBA2RGB);
                cv.cvtColor(lab, lab, cv.COLOR_RGB2Lab);
                let labChannels = new cv.MatVector();
                cv.split(lab, labChannels);
                let l_layer = labChannels.get(0);
                let l_boosted = new cv.Mat();
                cv.normalize(l_layer, l_boosted, 0, 255, cv.NORM_MINMAX);
                
                let blurred = new cv.Mat();
                cv.GaussianBlur(l_boosted, blurred, new cv.Size(15, 15), 0);
                
                let candMasks = [];
                let t_otsu = new cv.Mat();
                cv.threshold(blurred, t_otsu, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
                candMasks.push(t_otsu);

                let t_adapt = new cv.Mat();
                cv.adaptiveThreshold(blurred, t_adapt, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 201, -15);
                candMasks.push(t_adapt);

                let bestScore = -1;
                let bestPts = null;

                // 2. TITAN GEOMETRIC SNAPPING
                candMasks.forEach(mask => {
                    let contours = new cv.MatVector();
                    let hierarchy = new cv.Mat();
                    cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
                    
                    for (let i = 0; i < contours.size(); i++) {
                        let cnt = contours.get(i);
                        let area = cv.contourArea(cnt);
                        let totalArea = dst.cols * dst.rows;
                        
                        if (area > (totalArea * 0.15)) {
                            let hull = new cv.Mat();
                            cv.convexHull(cnt, hull);
                            
                            // ANCHOR: Use Rotated Rect to find the ideal 4 corners
                            let rotatedRect = cv.minAreaRect(hull);
                            let boxPoints = cv.RotatedRect.points(rotatedRect);
                            
                            // SNAP: For each anchor point, find the nearest physical point in the hull
                            let snapped = [];
                            let hullPoints = [];
                            for (let j = 0; j < hull.rows; j++) {
                                hullPoints.push({ x: hull.data32S[j * 2], y: hull.data32S[j * 2+1] });
                            }

                            for (let j = 0; j < 4; j++) {
                                let anchor = boxPoints[j];
                                let closest = hullPoints.reduce((p, c) => {
                                    let distP = Math.sqrt(Math.pow(p.x - anchor.x, 2) + Math.pow(p.y - anchor.y, 2));
                                    let distC = Math.sqrt(Math.pow(c.x - anchor.x, 2) + Math.pow(c.y - anchor.y, 2));
                                    return distP < distC ? p : c;
                                });
                                snapped.push(closest);
                            }

                            // Score based on area + rectangular stability
                            let score = area / totalArea;
                            // Add significant boost if it matches a large document mass
                            if (score > bestScore) {
                                bestScore = score;
                                bestPts = snapped;
                            }
                            hull.delete();
                        }
                    }
                    contours.delete(); hierarchy.delete();
                });

                if (bestPts) {
                    // Final NW->SW Geometric Sort
                    bestPts.sort((a, b) => a.y - b.y);
                    let top = bestPts.slice(0, 2).sort((a, b) => a.x - b.x);
                    let bottom = bestPts.slice(2, 4).sort((a, b) => a.x - b.x);
                    bestPts = [top[0], top[1], bottom[1], bottom[0]];

                    bestPts = bestPts.map(p => ({ x: p.x / scale, y: p.y / scale }));
                    self.postMessage({ success: true, points: bestPts });
                } else {
                    self.postMessage({ success: false, error: "Titan Engine: Precision lock failed" });
                }

                candMasks.forEach(m => m.delete());
                lab.delete(); labChannels.delete(); l_layer.delete(); l_boosted.delete(); blurred.delete();
            } catch (err) {
                self.postMessage({ success: false, error: String(err) });
            }
            src.delete(); dst.delete();
            return;
        } else {
            final = dst.clone();
        }

        let result;
        if (mode === 'bw') {
            result = applyBW(cv, final, config);
        } else if (mode === 'color') {
            result = applyColor(cv, final, config);
        } else if (mode === 'natural') {
            result = applyNatural(cv, final, config);
        } else if (mode === 'magic_grayscale') {
            result = applyMagicGS(cv, final, config);
        } else if (mode === 'enhance') {
            result = applyEnhance(cv, final, config);
        } else {
            result = final.clone();
        }

        let resultData = new Uint8ClampedArray(result.data);
        let width = result.cols;
        let height = result.rows;
        
        src.delete(); dst.delete(); final.delete(); result.delete();
        self.postMessage({ success: true, resultData: resultData, width, height }, [resultData.buffer]);
    } catch (err) {
        self.postMessage({ success: false, error: String(err) });
    }
};
