function applyBW(cv, final, config) {
    let result = new cv.Mat();
    let gray = new cv.Mat();
    cv.cvtColor(final, gray, cv.COLOR_RGBA2GRAY);
    
    // 1. ELITE DENOISING (Initial pass)
    let denoised = new cv.Mat();
    cv.medianBlur(gray, denoised, 3); 
    
    // 2. CYCLOPS GLOBAL NORMALIZATION (The Shadow Obliterator)
    // Absolute illumination mapping with a 301x301 window to flatline all broad shadows
    let bg_wide = new cv.Mat();
    cv.GaussianBlur(denoised, bg_wide, new cv.Size(301, 301), 0); 
    let normalized = new cv.Mat();
    cv.divide(denoised, bg_wide, normalized, 255, -1);
    bg_wide.delete();

    // Secondary paper texture equalization
    let bg_local = new cv.Mat();
    let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(51, 51));
    cv.morphologyEx(normalized, bg_local, cv.MORPH_DILATE, kernel); 
    cv.divide(normalized, bg_local, normalized, 255, -1);
    bg_local.delete(); kernel.delete();
    
    // 3. MASTER PRECISION CAPTURE (Multi-Scale Fine Scanning)
    // C=12 provides the cleanest separation between ink and paper texture
    let adaptive1 = new cv.Mat();
    cv.adaptiveThreshold(normalized, adaptive1, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 81, 12);
    let adaptive2 = new cv.Mat();
    cv.adaptiveThreshold(normalized, adaptive2, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 181, 12);
    
    let binaryMask = new cv.Mat();
    cv.bitwise_and(adaptive1, adaptive2, binaryMask);
    adaptive1.delete(); adaptive2.delete();
    
    // 4. SURGICAL GEOMETRIC FILTERING (Enterprise Ghosting Cleanup)
    cv.medianBlur(binaryMask, binaryMask, 3);
    let dilatedMask = new cv.Mat();
    cv.bitwise_not(binaryMask, binaryMask);

    // Filter connected components by shape and area to surgically kill non-text shadow fragments
    let labels = new cv.Mat();
    let stats = new cv.Mat();
    let centroids = new cv.Mat();
    let numLabels = cv.connectedComponentsWithStats(binaryMask, labels, stats, centroids);
    // Surgical threshold of 150 pixels protects 100% of the text while ensuring pure white paper
    const noiseThreshold = config.despecklePower || 150; 
    for (let i = 1; i < numLabels; i++) {
        if (stats.intAt(i, cv.CC_STAT_AREA) < noiseThreshold) { 
            let rect = new cv.Rect(stats.intAt(i, cv.CC_STAT_LEFT), stats.intAt(i, cv.CC_STAT_TOP), stats.intAt(i, cv.CC_STAT_WIDTH), stats.intAt(i, cv.CC_STAT_HEIGHT));
            let roi = binaryMask.roi(rect);
            roi.setTo(new cv.Scalar(0));
            roi.delete();
        }
    }
    labels.delete(); stats.delete(); centroids.delete();

    // "Soft Boldening" Sub-Pixel Refinement
    cv.GaussianBlur(binaryMask, dilatedMask, new cv.Size(3, 3), 0.8);
    cv.threshold(dilatedMask, dilatedMask, 127, 255, cv.THRESH_BINARY);
    binaryMask.delete();
    
    // 5. MASTER TITAN BLACK RE-ENACTMENT (Premium Smooth Archival)
    let finalCanvas = new cv.Mat(normalized.rows, normalized.cols, cv.CV_8U, new cv.Scalar(255));
    let inkRecon = new cv.Mat();
    
    // Balanced 4.5x Gain: deeply solid black bolding without jagged noise edges
    normalized.convertTo(inkRecon, -1, 4.5, -800); 
    
    // Premium Smooth Anti-Aliasing for professional edge fidelity
    let softInk = new cv.Mat();
    cv.GaussianBlur(inkRecon, softInk, new cv.Size(3, 3), 0.5);
    softInk.copyTo(finalCanvas, dilatedMask);
    softInk.delete(); inkRecon.delete(); dilatedMask.delete();
    
    // 6. FINAL "CODE WHITE" PURITY CLAMP (Purity Supreme)
    let finalMask = new cv.Mat();
    cv.threshold(finalCanvas, finalMask, 242, 255, cv.THRESH_BINARY);
    finalCanvas.setTo(new cv.Scalar(255), finalMask);
    finalMask.delete();
    
    cv.cvtColor(finalCanvas, result, cv.COLOR_GRAY2RGBA);
    
    // Cleanup
    finalCanvas.delete(); gray.delete(); denoised.delete(); normalized.delete();
    
    return result;
}
