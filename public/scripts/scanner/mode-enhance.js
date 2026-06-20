function applyEnhance(cv, final, config) {
    let result = new cv.Mat();
    let lab = new cv.Mat();

    // Convert to Lab Color Space to isolate Lightness from Colors
    cv.cvtColor(final, lab, cv.COLOR_RGBA2RGB);
    cv.cvtColor(lab, lab, cv.COLOR_RGB2Lab);

    let channels = new cv.MatVector();
    cv.split(lab, channels);
    let L = channels.get(0);
    let A = channels.get(1);
    let B = channels.get(2);

    // Initial noise reduction on Lightness channel
    cv.medianBlur(L, L, 3);

    // 1. RESOLUTION-AWARE DYNAMIC KERNELS
    let width = final.cols;
    let height = final.rows;
    let maxDim = Math.max(width, height);

    // Scale shadow removal size relative to document resolution (approx 12.5% of max dimension)
    let wideSize = Math.floor(maxDim / 8) | 1;
    if (wideSize < 81) wideSize = 81; // Safe minimum

    // Scale local structure size for fine paper flattening (approx 2% of max dimension)
    let localSize = Math.floor(maxDim / 50) | 1;
    if (localSize < 11) localSize = 11; // Safe minimum

    // 2. ADAPTIVE SHADOW ELIMINATION
    let bg_wide = new cv.Mat();
    cv.GaussianBlur(L, bg_wide, new cv.Size(wideSize, wideSize), 0);
    let normalized = new cv.Mat();
    cv.divide(L, bg_wide, normalized, 255, -1);
    bg_wide.delete();

    // Local paper texture flattening
    let bg_local = new cv.Mat();
    let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(localSize, localSize));
    cv.morphologyEx(normalized, bg_local, cv.MORPH_DILATE, kernel);
    cv.divide(normalized, bg_local, normalized, 255, -1);
    bg_local.delete(); kernel.delete();

    // 3. ADAPTIVE CONTRAST & BRIGHTNESS ANALYSIS
    let dummyMask = new cv.Mat();
    let meanScalar = cv.mean(L, dummyMask);
    let pageMean = meanScalar[0];
    dummyMask.delete();

    // Scale normalized mean from [120, 220] range to [0.0, 1.0] range
    let normMean = (pageMean - 120) / (220 - 120);
    normMean = Math.min(1.0, Math.max(0.0, normMean));

    // Dynamically calculate S-Curve midpoint (x0) and steepness (k) based on page brightness
    // Shifting x0 higher (up to 0.74) bolds and preserves extremely faint handwriting on dark/shadowy pages
    // Shifting x0 lower (down to 0.60) keeps printed text sharp and separated on clean pages
    let x0 = 0.74 - normMean * 0.14;
    let k = 10.0 + normMean * 4.0;

    // CLAHE contrast enhancement for text details
    let clahe = new cv.CLAHE(4.5, new cv.Size(8, 8));
    clahe.apply(normalized, normalized);
    clahe.delete();

    // Apply Dynamic S-Curve Sigmoid LUT
    let lut = new cv.Mat(1, 256, cv.CV_8U);
    for (let i = 0; i < 256; i++) {
        let val = i / 255.0;
        let res = 1.0 / (1.0 + Math.exp(-k * (val - x0)));
        // Clamp minimum value to 45 to keep text dark but allow color channels to show through
        lut.data[i] = Math.min(255, Math.max(45, res * 255.0));
    }
    cv.LUT(normalized, lut, normalized);
    lut.delete();

    // 4. THE ADAPTIVE PURE WHITE CLAMP
    // Scale clamping based on original page brightness to safely target background paper
    let clampThreshold = Math.min(243, Math.max(236, pageMean * 1.15));
    let clampMask = new cv.Mat();
    cv.threshold(normalized, clampMask, clampThreshold, 255, cv.THRESH_BINARY);
    normalized.setTo(new cv.Scalar(255), clampMask);
    clampMask.delete();

    // 5. STRONG SHARPNESS RESTORATION (Crisp text edges)
    let sharp = new cv.Mat();
    cv.GaussianBlur(normalized, sharp, new cv.Size(0, 0), 3.0);
    cv.addWeighted(normalized, 2.3, sharp, -1.3, 0, normalized);
    sharp.delete();

    // 6. COLOR RECONSTRUCTION & ZERO-NOISE BACKGROUND
    // Replace processed lightness channel
    channels.set(0, normalized);

    // Create a paper background mask (where page is now pure white)
    let paperMask = new cv.Mat();
    cv.threshold(normalized, paperMask, 254, 255, cv.THRESH_BINARY);

    // Calculate the ambient color cast of the paper background
    let meanA = cv.mean(A, paperMask)[0];
    let meanB = cv.mean(B, paperMask)[0];

    // Apply White Balance shift: subtract color cast to normalize paper background to 128
    A.convertTo(A, -1, 1.0, 128.0 - meanA);
    B.convertTo(B, -1, 1.0, 128.0 - meanB);

    // Boost saturation of color channels to make original inks/stamps pop (CamScanner Magic Color)
    A.convertTo(A, -1, 1.6, (1 - 1.6) * 128.0);
    B.convertTo(B, -1, 1.6, (1 - 1.6) * 128.0);

    // Force color channels to exact neutral 128 on white paper to eliminate chromatic aberration
    A.setTo(new cv.Scalar(128), paperMask);
    B.setTo(new cv.Scalar(128), paperMask);
    paperMask.delete();

    // Merge channels and convert back to RGBA
    cv.merge(channels, lab);
    cv.cvtColor(lab, result, cv.COLOR_Lab2RGB);
    cv.cvtColor(result, result, cv.COLOR_RGB2RGBA);

    // Clean up
    L.delete(); A.delete(); B.delete();
    normalized.delete(); lab.delete(); channels.delete();

    return result;
}
